import { buildMerkleTree, MerkleTreeResult } from "../merkle/tree.service";
import { generateProof, generateAllProofs, ProofResult } from "../merkle/proof.service";
import { prisma } from "../db/prisma";

const CHAIN_ID = 11155111; // Sepolia

interface AirdropEntry {
  wallet: string;
  amount: string | number | bigint;
}

/**
 * Build Merkle tree from eligible users in database
 */
export const buildTreeFromDb = async (): Promise<MerkleTreeResult | null> => {
  const eligibleUsers = await prisma.user.findMany({
    where: { isEligible: true, isBlocked: false },
  });

  if (eligibleUsers.length === 0) return null;

  const entries = eligibleUsers.map((u) => ({
    wallet: u.wallet,
    amount: u.amount || u.tokensAllocated,
  }));

  return buildMerkleTree(entries, CHAIN_ID);
};

/**
 * Get proof for a specific wallet from database
 */
export const getProofFromDb = async (wallet: string): Promise<ProofResult | null> => {
  const user = await prisma.user.findUnique({
    where: { wallet: wallet.toLowerCase() },
  });

  if (!user || !user.merkleProof || user.merkleProof.length === 0) {
    return null;
  }

  // Get current active root
  const snapshot = await prisma.merkleSnapshot.findFirst({
    where: { isActive: true, chainId: CHAIN_ID },
    orderBy: { createdAt: "desc" },
  });

  return {
    leaf: user.merkleLeaf || "",
    proof: user.merkleProof,
    root: snapshot?.root || "",
  };
};

/**
 * Generate proof on-the-fly (fallback if not in DB)
 */
export const generateProofOnTheFly = async (wallet: string): Promise<ProofResult | null> => {
  const user = await prisma.user.findUnique({
    where: { wallet: wallet.toLowerCase() },
  });

  if (!user || !user.isEligible) return null;

  const allUsers = await prisma.user.findMany({
    where: { isEligible: true, isBlocked: false },
  });

  const entries = allUsers.map((u) => ({
    wallet: u.wallet,
    amount: u.amount || u.tokensAllocated,
  }));

  return generateProof(wallet, user.amount || user.tokensAllocated, entries, CHAIN_ID);
};