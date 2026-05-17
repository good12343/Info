import { prisma } from "../db/prisma";
import { airdropContractRead } from "../blockchain/airdrop.contract";

const CHAIN_ID = 11155111;

/**
 * Verify a claim transaction on blockchain
 */
export const verifyClaim = async (wallet: string, txHash: string) => {
  try {
    // Get receipt
    const provider = airdropContractRead.runner?.provider;
    if (!provider) {
      return { verified: false, error: "Provider not available" };
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { verified: false, error: "Transaction not found" };
    }

    if (receipt.status !== 1) {
      return { verified: false, error: "Transaction failed" };
    }

    // Check if user has claimed on chain
    const claimed = await airdropContractRead.claimed(wallet.toLowerCase());
    
    return {
      verified: true,
      claimed,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error("Verify claim error:", error);
    return { verified: false, error: "Verification failed" };
  }
};

/**
 * Get claim statistics
 */
export const getClaimStats = async () => {
  const [
    totalEligible,
    totalClaimed,
    totalAllocated,
    recentClaims,
  ] = await Promise.all([
    prisma.user.count({ where: { isEligible: true } }),
    prisma.user.count({ where: { hasClaimed: true } }),
    prisma.user.aggregate({
      where: { isEligible: true },
      _sum: { tokensAllocated: true },
    }),
    prisma.auditLog.count({
      where: { action: "CLAIM", createdAt: { gte: new Date(Date.now() - 86400000) } },
    }),
  ]);

  return {
    totalEligible,
    totalClaimed,
    totalAllocated: totalAllocated._sum?.tokensAllocated || "0",
    claimRate: totalEligible > 0 ? (totalClaimed / totalEligible) * 100 : 0,
    recentClaims24h: recentClaims,
  };
};