import { prisma } from "../db/prisma";
import { UserCategory, UserTier } from "@prisma/client";

const CHAIN_ID = 11155111;

/**
 * 🏷️ Classify a user based on their activity
 */
export const classifyUser = async (wallet: string): Promise<UserCategory> => {
  const user = await prisma.user.findUnique({
    where: { wallet: wallet.toLowerCase() },
  });

  if (!user) return UserCategory.NONE;

  const hasAirdrop = user.airdropPoints > 0 || BigInt(user.tokensAllocated) > 0n;
  const hasBought = user.totalBought > 0 || BigInt(user.tokensBought) > 0n;

  if (hasAirdrop && hasBought) return UserCategory.AIRDROP_BUYER;
  if (hasAirdrop && !hasBought) return UserCategory.AIRDROP_ONLY;
  if (!hasAirdrop && hasBought) return UserCategory.BUYER_ONLY;
  
  return UserCategory.NONE;
};

/**
 * 🎖️ Determine user tier based on total value
 */
export const determineTier = (totalPoints: number): UserTier => {
  if (totalPoints >= 10001) return UserTier.PLATINUM;
  if (totalPoints >= 5001) return UserTier.GOLD;
  if (totalPoints >= 1001) return UserTier.SILVER;
  return UserTier.BRONZE;
};

/**
 * 🔄 Update user classification and tier
 */
export const updateUserClassification = async (wallet: string) => {
  const user = await prisma.user.findUnique({
    where: { wallet: wallet.toLowerCase() },
  });

  if (!user) return null;

  const category = await classifyUser(wallet);
  
  // Calculate total points for tier
  const totalPoints = user.airdropPoints + user.totalBought;
  const tier = determineTier(totalPoints);

  const updated = await prisma.user.update({
    where: { wallet: wallet.toLowerCase() },
    data: { category, tier },
  });

  return updated;
};

/**
 * 📊 Get category statistics
 */
export const getCategoryStats = async () => {
  const stats = await prisma.user.groupBy({
    by: ["category"],
    _count: { wallet: true },
    _sum: { 
      tokensAllocated: true,
      tokensBought: true,
    },
    where: { isBlocked: false },
  });

  const claimedStats = await prisma.user.groupBy({
    by: ["category"],
    _count: { wallet: true },
    where: { hasClaimed: true, isBlocked: false },
  });

  return stats.map((s) => {
    const claimed = claimedStats.find((c) => c.category === s.category);
    const totalUsers = s._count.wallet;
    const claimedUsers = claimed?._count.wallet || 0;
    
    return {
      category: s.category,
      userCount: totalUsers,
      totalTokens: (
        BigInt(s._sum.tokensAllocated || "0") + 
        BigInt(s._sum.tokensBought || "0")
      ).toString(),
      claimedCount: claimedUsers,
      claimRate: totalUsers > 0 ? (claimedUsers / totalUsers) * 100 : 0,
    };
  });
};

/**
 * 🎖️ Get tier statistics
 */
export const getTierStats = async () => {
  const stats = await prisma.user.groupBy({
    by: ["tier"],
    _count: { wallet: true },
    _sum: { tokensAllocated: true },
    where: { isBlocked: false, isEligible: true },
  });

  return stats.map((s) => ({
    tier: s.tier,
    userCount: s._count.wallet,
    totalTokens: s._sum.tokensAllocated || "0",
  }));
};

/**
 * 📋 Get users by category
 */
export const getUsersByCategory = async (
  category: UserCategory,
  options: { skip?: number; take?: number } = {}
) => {
  return prisma.user.findMany({
    where: { category, isBlocked: false },
    skip: options.skip || 0,
    take: options.take || 100,
    orderBy: { tokensAllocated: "desc" },
    select: {
      wallet: true,
      category: true,
      tier: true,
      airdropPoints: true,
      totalBought: true,
      tokensAllocated: true,
      tokensBought: true,
      hasClaimed: true,
      createdAt: true,
    },
  });
};

/**
 * 🔍 Get detailed user report
 */
export const getUserReport = async (wallet: string) => {
  const user = await prisma.user.findUnique({
    where: { wallet: wallet.toLowerCase() },
    include: {
      _count: {
        select: { Purchase: true },
      },
    },
  });

  if (!user) return null;

  const category = await classifyUser(wallet);
  const purchases = await prisma.purchase.findMany({
    where: { userId: wallet.toLowerCase() },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    wallet: user.wallet,
    category,
    tier: user.tier,
    
    // Airdrop stats
    airdrop: {
      points: user.airdropPoints,
      tokensAllocated: user.tokensAllocated,
      hasClaimed: user.hasClaimed,
      claimedAt: user.claimedAt,
    },
    
    // Purchase stats
    purchase: {
      totalBought: user.totalBought,
      tokensBought: user.tokensBought,
      purchaseCount: user.purchaseCount,
      totalSpentUsd: user.totalSpentUsd,
      firstPurchaseAt: user.firstPurchaseAt,
      lastPurchaseAt: user.lastPurchaseAt,
      recentPurchases: purchases,
    },
    
    // Combined
    totalTokens: (
      BigInt(user.tokensAllocated || "0") + 
      BigInt(user.tokensBought || "0")
    ).toString(),
    
    // Risk
    riskScore: user.riskScore,
    isBlocked: user.isBlocked,
  };
};

/**
 * 📈 Generate daily category stats
 */
export const generateDailyStats = async () => {
  const categories = Object.values(UserCategory);
  
  for (const category of categories) {
    const users = await prisma.user.findMany({
      where: { category, isBlocked: false },
    });

    const totalTokens = users.reduce(
      (sum, u) => sum + BigInt(u.tokensAllocated || "0") + BigInt(u.tokensBought || "0"),
      0n
    );

    const claimedCount = users.filter((u) => u.hasClaimed).length;
    const avgTokens = users.length > 0 
      ? (totalTokens / BigInt(users.length)).toString() 
      : "0";

    await prisma.categoryStats.create({
      data: {
        category,
        userCount: users.length,
        totalTokens: totalTokens.toString(),
        avgTokens,
        claimedCount,
        claimRate: users.length > 0 ? (claimedCount / users.length) * 100 : 0,
      },
    });
  }
};