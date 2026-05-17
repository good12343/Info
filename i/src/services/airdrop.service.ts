import { prisma } from "../db/prisma";
import { calculateAirdrop } from "../engine/airdrop.rules";
import { buildMerkleTree } from "../merkle/tree.service";
import { generateAllProofs } from "../merkle/proof.service";
import { airdropContractRead } from "../blockchain/airdrop.contract";

const CHAIN_ID = 11155111; // Sepolia

/**
 * Process airdrop allocation (admin only)
 */
export const processAirdrop = async (wallet: string, points: number) => {
  // 1. Get user data
  const user = await prisma.user.findUnique({
    where: { wallet: wallet.toLowerCase() },
  });

  if (user?.isBlocked) {
    return { status: "rejected", wallet, reason: "User is blocked" };
  }

  // 2. Run rules engine
  const result = calculateAirdrop({
    wallet,
    points,
    totalBought: user?.totalBought || 0,
  });

  if (!result.approved) {
    return { status: "rejected", wallet, reason: result.reason };
  }

  // 3. Update or create user
  const updatedUser = await prisma.user.upsert({
    where: { wallet: wallet.toLowerCase() },
    update: {
      airdropPoints: { increment: points },
      tokensAllocated: { increment: result.tokens.toString() },
      isEligible: true,
    },
    create: {
      wallet: wallet.toLowerCase(),
      airdropPoints: points,
      tokensAllocated: result.tokens.toString(),
      isEligible: true,
      amount: result.tokens.toString(),
      chainId: CHAIN_ID,
    },
  });

  return {
    status: "approved",
    wallet,
    tokens: result.tokens,
    user: updatedUser,
  };
};

/**
 * Check eligibility for a wallet
 */
export const checkEligibility = async (wallet: string) => {
  const normalizedWallet = wallet.toLowerCase();
  
  const user = await prisma.user.findUnique({
    where: { wallet: normalizedWallet },
  });

  if (!user || !user.isEligible) {
    return {
      eligible: false,
      amount: "0",
      proof: [],
      alreadyClaimed: false,
      message: "This address is not included in the airdrop list.",
    };
  }

  // Check blockchain state
  const [claimedOnChain, airdropState] = await Promise.all([
    airdropContractRead.claimed(normalizedWallet).catch(() => false),
    airdropContractRead.merkleRoot().catch(() => "0x"),
  ]);

  const rootSet = airdropState !== "0x0000000000000000000000000000000000000000000000000000000000000000";

  if (!rootSet) {
    return {
      eligible: true,
      amount: user.amount,
      proof: [],
      alreadyClaimed: user.hasClaimed || claimedOnChain,
      message: "Merkle root not set yet. Please wait for announcement.",
    };
  }

  return {
    eligible: true,
    amount: user.amount,
    proof: user.merkleProof || [],
    alreadyClaimed: user.hasClaimed || claimedOnChain,
    message: user.hasClaimed || claimedOnChain 
      ? "You have already claimed your airdrop."
      : "You are eligible to claim!",
  };
};

/**
 * Build Merkle tree and update all users with proofs
 */
export const buildAndUpdateMerkleTree = async () => {
  const eligibleUsers = await prisma.user.findMany({
    where: { isEligible: true, isBlocked: false },
  });

  if (eligibleUsers.length === 0) {
    return { status: "error", message: "No eligible users found" };
  }

  const entries = eligibleUsers.map((u) => ({
    wallet: u.wallet,
    amount: u.amount || u.tokensAllocated,
    chainId: CHAIN_ID,
  }));

  const treeResult = buildMerkleTree(entries, CHAIN_ID);
  if (!treeResult) {
    return { status: "error", message: "Failed to build Merkle tree" };
  }

  const { root, leaves } = treeResult;
  const allProofs = generateAllProofs(entries, CHAIN_ID);

  // Update all users with proofs
  const updates = eligibleUsers.map(async (user) => {
    const proofData = allProofs.get(user.wallet.toLowerCase());
    if (proofData) {
      await prisma.user.update({
        where: { wallet: user.wallet },
        data: {
          merkleProof: proofData.proof,
          merkleLeaf: proofData.leaf,
          amount: leaves.find((l) => l.wallet === user.wallet)?.amount || user.amount,
        },
      });
    }
  });

  await Promise.all(updates);

  // Save snapshot
  const totalAmount = eligibleUsers.reduce(
    (sum, u) => sum + BigInt(u.tokensAllocated),
    0n
  );

  await prisma.merkleSnapshot.create({
    data: {
      root,
      chainId: CHAIN_ID,
      totalUsers: eligibleUsers.length,
      totalAmount: totalAmount.toString(),
      isActive: true,
    },
  });

  return {
    status: "success",
    root,
    totalUsers: eligibleUsers.length,
    totalAmount: totalAmount.toString(),
  };
};

/**
 * Record a claim in the database
 */
export const recordClaim = async (wallet: string, txHash: string) => {
  const normalizedWallet = wallet.toLowerCase();
  
  await prisma.$transaction([
    prisma.user.update({
      where: { wallet: normalizedWallet },
      data: {
        hasClaimed: true,
        claimedAt: new Date(),
        claimTxHash: txHash,
        claimableTokens: "0",
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "CLAIM",
        userId: normalizedWallet,
        txHash,
        chainId: CHAIN_ID,
      },
    }),
  ]);

  return { status: "success", wallet, txHash };
};