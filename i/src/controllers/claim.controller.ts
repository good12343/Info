import { Request, Response } from "express";
import { ethers } from "ethers";
import { airdropContractRead } from "../blockchain/airdrop.contract";
import { recordClaim } from "../services/airdrop.service";
import { logAction } from "../services/audit.service";
import { checkSybil } from "../services/sybil.service";
import { validateClaimRequest } from "../engine/validation";

const CHAIN_ID = 11155111; // Sepolia

/**
 * POST /api/claim
 * Submit a claim to the blockchain (called from frontend)
 */
export const submitClaim = async (req: Request, res: Response) => {
  try {
    const { wallet, amount, proof } = req.body;

    // 1. Validate request
    const validation = validateClaimRequest({ wallet, amount, proof, chainId: CHAIN_ID });
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const normalizedWallet = wallet.toLowerCase();

    // 2. Check Sybil protection
    const isAllowed = await checkSybil(normalizedWallet, req.ip || "");
    if (!isAllowed) {
      await logAction({
        action: "BLOCKED_CLAIM",
        userId: normalizedWallet,
        ip: req.ip,
        metadata: { reason: "Sybil detected" },
      });
      return res.status(403).json({ success: false, error: "Claim blocked" });
    }

    // 3. Check if already claimed
    const alreadyClaimed = await airdropContractRead.claimed(normalizedWallet);
    if (alreadyClaimed) {
      return res.status(400).json({ success: false, error: "Already claimed" });
    }

    // 4. Check airdrop state
    const [merkleRoot, claimStart, claimEnd, isPaused, isFinalized] = await Promise.all([
      airdropContractRead.merkleRoot(),
      airdropContractRead.claimStart(),
      airdropContractRead.claimEnd(),
      airdropContractRead.paused(),
      airdropContractRead.finalized(),
    ]);

    const now = Math.floor(Date.now() / 1000);
    const rootSet = merkleRoot !== "0x0000000000000000000000000000000000000000000000000000000000000000";

    if (!rootSet) {
      return res.status(400).json({ success: false, error: "Merkle root not set" });
    }
    if (isPaused) {
      return res.status(400).json({ success: false, error: "Airdrop is paused" });
    }
    if (isFinalized) {
      return res.status(400).json({ success: false, error: "Airdrop is finalized" });
    }
    if (now < Number(claimStart)) {
      return res.status(400).json({ success: false, error: "Claim not started" });
    }
    if (now > Number(claimEnd)) {
      return res.status(400).json({ success: false, error: "Claim ended" });
    }

    // 5. Verify Merkle proof on-chain (optional, frontend does the actual claim)
    // Here we just validate the proof format
    const proofValid = proof.length > 0 && proof.every((p: string) => 
      p.startsWith("0x") && p.length === 66
    );

    if (!proofValid) {
      return res.status(400).json({ success: false, error: "Invalid proof format" });
    }

    // 6. Log the claim attempt
    await logAction({
      action: "CLAIM_ATTEMPT",
      userId: normalizedWallet,
      ip: req.ip,
      metadata: { amount, proofLength: proof.length },
    });

    // 7. Return success (frontend will submit the actual tx)
    res.json({
      success: true,
      message: "Claim validated. Submit transaction to blockchain.",
      data: {
        wallet: normalizedWallet,
        amount,
        proof,
        merkleRoot,
        chainId: CHAIN_ID,
      },
    });

  } catch (err: any) {
    console.error("Claim error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/claim/confirm
 * Confirm a claim after blockchain transaction
 */
export const confirmClaim = async (req: Request, res: Response) => {
  try {
    const { wallet, txHash } = req.body;

    if (!wallet || !txHash) {
      return res.status(400).json({ success: false, error: "Missing wallet or txHash" });
    }

    const normalizedWallet = wallet.toLowerCase();

    // Verify transaction on blockchain
    const provider = airdropContractRead.runner?.provider;
    if (!provider) {
      return res.status(500).json({ success: false, error: "Provider not available" });
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      return res.status(400).json({ success: false, error: "Transaction failed or not found" });
    }

    // Record claim in database
    const result = await recordClaim(normalizedWallet, txHash);

    // Log
    await logAction({
      action: "CLAIM_CONFIRMED",
      userId: normalizedWallet,
      txHash,
      ip: req.ip,
      metadata: { blockNumber: receipt.blockNumber },
    });

    res.json({
      success: true,
      message: "Claim confirmed",
      data: result,
    });

  } catch (err: any) {
    console.error("Confirm claim error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/claim/status/:wallet
 * Get claim status for a wallet
 */
export const getClaimStatus = async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const normalizedWallet = wallet.toLowerCase();

    const [claimedOnChain, user] = await Promise.all([
      airdropContractRead.claimed(normalizedWallet).catch(() => false),
      prisma.user.findUnique({
        where: { wallet: normalizedWallet },
        select: {
          hasClaimed: true,
          claimedAt: true,
          claimTxHash: true,
          tokensAllocated: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        wallet: normalizedWallet,
        claimedOnChain,
        claimedInDb: user?.hasClaimed || false,
        claimedAt: user?.claimedAt,
        txHash: user?.claimTxHash,
        amount: user?.tokensAllocated || "0",
      },
    });

  } catch (err: any) {
    console.error("Get claim status error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const claimController = {
  submitClaim,
  confirmClaim,
  getClaimStatus,
};