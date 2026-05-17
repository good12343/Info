import { Request, Response } from "express";
import { 
  processAirdrop, 
  checkEligibility, 
  buildAndUpdateMerkleTree,
  recordClaim 
} from "../services/airdrop.service";

/**
 * POST /api/airdrop
 * Process airdrop allocation (admin only)
 */
export const airdropController = async (req: Request, res: Response) => {
  try {
    const { wallet, points } = req.body;

    if (!wallet || !points) {
      return res.status(400).json({ error: "Missing wallet or points" });
    }

    const result = await processAirdrop(wallet, points);
    res.json(result);
  } catch (error) {
    console.error("Airdrop error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/airdrop/eligibility?address=0x...
 * Check if a wallet is eligible for airdrop
 */
export const eligibilityController = async (req: Request, res: Response) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "Missing address parameter" });
    }

    const result = await checkEligibility(address);
    res.json(result);
  } catch (error) {
    console.error("Eligibility check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/airdrop/build-tree
 * Build Merkle tree and update all users (admin only)
 */
export const buildTreeController = async (req: Request, res: Response) => {
  try {
    const result = await buildAndUpdateMerkleTree();
    res.json(result);
  } catch (error) {
    console.error("Build tree error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/airdrop/record-claim
 * Record a claim after blockchain confirmation
 */
export const recordClaimController = async (req: Request, res: Response) => {
  try {
    const { wallet, txHash } = req.body;

    if (!wallet || !txHash) {
      return res.status(400).json({ error: "Missing wallet or txHash" });
    }

    const result = await recordClaim(wallet, txHash);
    res.json(result);
  } catch (error) {
    console.error("Record claim error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};