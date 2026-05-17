import { prisma } from "../db/prisma";
import { buildMerkleTree } from "./tree.service";
import { generateAllProofs } from "./proof.service";
import { UserCategory } from "@prisma/client";

const CHAIN_ID = 11155111; // Sepolia

interface SnapshotEntry {
  wallet: string;
  amount: string;
}

/**
 * 📸 Create a new Merkle snapshot
 */
export const createSnapshot = async (
  entries: SnapshotEntry[],
  category: UserCategory = UserCategory.AIRDROP_ONLY
) => {
  if (entries.length === 0) {
    return { status: "error", message: "No entries provided" };
  }

  // Build tree
  const treeResult = buildMerkleTree(
    entries.map((e) => ({ ...e, chainId: CHAIN_ID })),
    CHAIN_ID
  );

  if (!treeResult) {
    return { status: "error", message: "Failed to build Merkle tree" };
  }

  const { root, leaves } = treeResult;

  // Generate proofs
  const allProofs = generateAllProofs(
    entries.map((e) => ({ ...e, chainId: CHAIN_ID })),
    CHAIN_ID
  );

  // Calculate total
  const totalAmount = entries.reduce(
    (sum, e) => sum + BigInt(e.amount),
    0n
  );

  // Deactivate old snapshots for this category
  await prisma.merkleSnapshot.updateMany({
    where: { category, chainId: CHAIN_ID },
    data: { isActive: false },
  });

  // Create new snapshot
  const snapshot = await prisma.merkleSnapshot.create({
    data: {
      root,
      chainId: CHAIN_ID,
      totalUsers: entries.length,
      totalAmount: totalAmount.toString(),
      category,
      isActive: true,
    },
  });

  // Update users with proofs
  for (const entry of entries) {
    const proofData = allProofs.get(entry.wallet.toLowerCase());
    if (proofData) {
      await prisma.user.update({
        where: { wallet: entry.wallet.toLowerCase() },
        data: {
          merkleProof: proofData.proof,
          merkleLeaf: proofData.leaf,
          amount: entry.amount,
        },
      });
    }
  }

  return {
    status: "success",
    snapshotId: snapshot.id,
    root,
    totalUsers: entries.length,
    totalAmount: totalAmount.toString(),
    category,
  };
};

/**
 * 📋 Get active snapshot
 */
export const getActiveSnapshot = async (category?: UserCategory) => {
  return prisma.merkleSnapshot.findFirst({
    where: {
      isActive: true,
      chainId: CHAIN_ID,
      ...(category && { category }),
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * 📊 Get snapshot history
 */
export const getSnapshotHistory = async (limit: number = 10) => {
  return prisma.merkleSnapshot.findMany({
    where: { chainId: CHAIN_ID },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

/**
 * 🔍 Get snapshot by root
 */
export const getSnapshotByRoot = async (root: string) => {
  return prisma.merkleSnapshot.findFirst({
    where: { root, chainId: CHAIN_ID },
  });
};

/**
 * 🗑️ Deactivate old snapshots
 */
export const deactivateOldSnapshots = async (keepLatest: number = 3) => {
  const snapshots = await prisma.merkleSnapshot.findMany({
    where: { chainId: CHAIN_ID, isActive: true },
    orderBy: { createdAt: "desc" },
    skip: keepLatest,
  });

  for (const snap of snapshots) {
    await prisma.merkleSnapshot.update({
      where: { id: snap.id },
      data: { isActive: false },
    });
  }

  return { deactivated: snapshots.length };
};