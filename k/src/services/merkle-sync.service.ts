import { prisma } from "../db/prisma";
import { buildMerkleTree } from "../merkle/tree.service";
import { generateAllProofs } from "../merkle/proof.service";
import { airdropContractWrite, airdropContractRead } from "../blockchain/airdrop.contract";
import { getEligibleUsers } from "./allocation.service";

const CHAIN_ID = 11155111;

/**
 * 🔄 Merkle Sync Service
 * Responsible ONLY for:
 * - Building full Merkle Tree
 * - Generating all proofs
 * - Pushing root to smart contract
 * - Syncing eligibility state
 * 
 * Called by: Merkle Worker (batch process)
 * NOT called by: Task Worker or Reward Service
 */

export interface MerkleSyncResult {
  success: boolean;
  root: string;
  txHash?: string;
  eligibleCount: number;
  totalAmountWei: string;
  error?: string;
}

/**
 * Build Merkle tree from all eligible users
 * Returns tree data without DB writes
 */
export const buildFullMerkleTree = async () => {
  const eligibleUsers = await getEligibleUsers();

  if (eligibleUsers.length === 0) {
    return null;
  }

  const entries = eligibleUsers.map((u) => ({
    wallet: u.wallet.toLowerCase(),
    amount: u.airdropAllocatedWei,
  }));

  const treeResult = buildMerkleTree(entries, CHAIN_ID);
  if (!treeResult) return null;

  return {
    ...treeResult,
    eligibleCount: eligibleUsers.length,
    entries,
  };
};

/**
 * Generate and save all proofs to database
 * Called during batch rebuild
 */
export const saveAllProofs = async (
  entries: { wallet: string; amount: string }[],
  root: string
) => {
  const proofs = generateAllProofs(entries, CHAIN_ID);

  // Batch update users with their proofs
  const updates = [];
  for (const [wallet, proofData] of proofs.entries()) {
    updates.push(
      prisma.user.update({
        where: { wallet },
        data: {
          merkleProof: proofData.proof,
          merkleLeaf: proofData.leaf,
          chainId: CHAIN_ID,
        },
      })
    );
  }

  await prisma.$transaction(updates);

  return proofs.size;
};

/**
 * Push Merkle root to smart contract
 * Returns transaction hash
 */
export const pushMerkleRootToContract = async (
  root: string
): Promise<string> => {
  if (!airdropContractWrite) {
    throw new Error("Airdrop contract write instance not available");
  }

  // Check if root is already set
  const currentRoot = await airdropContractRead.merkleRoot();
  if (currentRoot.toLowerCase() === root.toLowerCase()) {
    throw new Error("Merkle root already set to this value");
  }

  // Send transaction
  const tx = await airdropContractWrite.setMerkleRoot(root);
  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("Transaction failed");
  }

  return tx.hash;
};

/**
 * Full sync: Build tree → Save proofs → Push root
 * This is the main batch operation
 */
export const syncMerkleDistribution = async (): Promise<MerkleSyncResult> => {
  try {
    // Step 1: Build tree
    const treeData = await buildFullMerkleTree();
    
    if (!treeData) {
      return {
        success: false,
        root: "0x0",
        eligibleCount: 0,
        totalAmountWei: "0",
        error: "No eligible users found",
      };
    }

    const { root, entries, eligibleCount } = treeData;

    // Calculate total amount
    const totalAmountWei = entries
      .reduce((sum, e) => sum + BigInt(e.amount), BigInt(0))
      .toString();

    // Step 2: Save proofs to DB
    await saveAllProofs(entries, root);

    // Step 3: Push root to contract
    let txHash: string | undefined;
    try {
      txHash = await pushMerkleRootToContract(root);
    } catch (contractError: any) {
      // If root is same, it's not a real error
      if (contractError.message.includes("already set")) {
        txHash = "already_set";
      } else {
        throw contractError;
      }
    }

    // Step 4: Update AirdropState
    await prisma.airdropState.upsert({
      where: { id: "1" }, // Singleton pattern
      update: {
        merkleRoot: root,
        totalEligible: eligibleCount,
        totalAmountWei,
        lastSyncedAt: new Date(),
        syncTxHash: txHash,
        status: "SYNCED",
        errorMessage: null,
      },
      create: {
        id: "1",
        merkleRoot: root,
        totalEligible: eligibleCount,
        totalAmountWei,
        lastSyncedAt: new Date(),
        syncTxHash: txHash,
        status: "SYNCED",
      },
    });

    return {
      success: true,
      root,
      txHash,
      eligibleCount,
      totalAmountWei,
    };
  } catch (error: any) {
    // Update state with error
    await prisma.airdropState.upsert({
      where: { id: "1" },
      update: {
        status: "FAILED",
        errorMessage: error.message,
        lastSyncedAt: new Date(),
      },
      create: {
        id: "1",
        status: "FAILED",
        errorMessage: error.message,
      },
    });

    return {
      success: false,
      root: "0x0",
      eligibleCount: 0,
      totalAmountWei: "0",
      error: error.message,
    };
  }
};

/**
 * Get current Merkle root from contract
 */
export const getContractMerkleRoot = async (): Promise<string> => {
  return await airdropContractRead.merkleRoot();
};

/**
 * Get current sync status
 */
export const getSyncStatus = async () => {
  const state = await prisma.airdropState.findUnique({
    where: { id: "1" },
  });

  const contractRoot = await getContractMerkleRoot();

  return {
    dbRoot: state?.merkleRoot || "0x0",
    contractRoot,
    inSync: state?.merkleRoot?.toLowerCase() === contractRoot.toLowerCase(),
    lastSyncedAt: state?.lastSyncedAt,
    totalEligible: state?.totalEligible || 0,
    totalAmountWei: state?.totalAmountWei || "0",
    status: state?.status || "PENDING",
    errorMessage: state?.errorMessage,
  };
};