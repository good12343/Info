import { prisma } from "../db/prisma";
import { saleContractRead } from "../blockchain/sale.contract";
import { logAction } from "./audit.service";
import { updateUserClassification } from "./classification.service";
import { getTokenInfo } from "../blockchain/token.contract";

const CHAIN_ID = 11155111; // Sepolia

/**
 * 📝 Record a purchase from blockchain event
 */
export const recordPurchase = async (data: {
  buyer: string;
  tokenAmount: string;
  price: string;
  currency: string;
  txHash: string;
  blockNumber: number;
}) => {
  const normalizedBuyer = data.buyer.toLowerCase();

  // Get token decimals for formatting
  const tokenInfo = await getTokenInfo().catch(() => ({ decimals: 18 }));

  // Calculate USD value
  const tokenAmountBigInt = BigInt(data.tokenAmount);
  const priceBigInt = BigInt(data.price);
  const usdValue = (tokenAmountBigInt * priceBigInt) / BigInt(10 ** tokenInfo.decimals);

  // Create or update user
  const user = await prisma.user.upsert({
    where: { wallet: normalizedBuyer },
    update: {
      totalBought: { increment: Number(usdValue) / 1e6 }, // Convert to USD
      tokensBought: { increment: data.tokenAmount },
      purchaseCount: { increment: 1 },
      totalSpentUsd: { increment: usdValue.toString() },
      lastPurchaseAt: new Date(),
    },
    create: {
      wallet: normalizedBuyer,
      totalBought: Number(usdValue) / 1e6,
      tokensBought: data.tokenAmount,
      purchaseCount: 1,
      totalSpentUsd: usdValue.toString(),
      firstPurchaseAt: new Date(),
      lastPurchaseAt: new Date(),
      chainId: CHAIN_ID,
    },
  });

  // Create purchase record
  await prisma.purchase.create({
    data: {
      userId: normalizedBuyer,
      txHash: data.txHash,
      amountUsd: usdValue.toString(),
      tokenAmount: data.tokenAmount,
      tokenPrice: data.price,
      currency: data.currency,
    },
  });

  // Update classification
  await updateUserClassification(normalizedBuyer);

  // Log
  await logAction({
    action: "PURCHASE",
    userId: normalizedBuyer,
    txHash: data.txHash,
    metadata: {
      tokenAmount: data.tokenAmount,
      price: data.price,
      currency: data.currency,
      blockNumber: data.blockNumber,
    },
  });

  return {
    status: "success",
    wallet: normalizedBuyer,
    tokenAmount: data.tokenAmount,
    usdValue: usdValue.toString(),
    category: user.category,
    tier: user.tier,
  };
};

/**
 * 🔄 Sync past purchases from blockchain
 */
export const syncPastPurchases = async (fromBlock: number, toBlock?: number) => {
  const { getPastPurchases } = require("../blockchain/sale.contract");
  
  const events = await getPastPurchases(fromBlock, toBlock);
  const results = [];

  for (const event of events) {
    // Check if already recorded
    const existing = await prisma.purchase.findFirst({
      where: { txHash: event.txHash },
    });

    if (!existing) {
      const result = await recordPurchase(event);
      results.push(result);
    }
  }

  return {
    status: "success",
    synced: results.length,
    totalEvents: events.length,
  };
};

/**
 * 📊 Get purchase statistics
 */
export const getPurchaseStats = async () => {
  const [
    totalPurchases,
    totalBuyers,
    totalTokensSold,
    totalUsdSpent,
    recentPurchases,
  ] = await Promise.all([
    prisma.purchase.count(),
    prisma.user.count({ where: { purchaseCount: { gt: 0 } } }),
    prisma.purchase.aggregate({ _sum: { tokenAmount: true } }),
    prisma.purchase.aggregate({ _sum: { amountUsd: true } }),
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { wallet: true, category: true } } },
    }),
  ]);

  return {
    totalPurchases,
    totalBuyers,
    totalTokensSold: totalTokensSold._sum?.tokenAmount || "0",
    totalUsdSpent: totalUsdSpent._sum?.amountUsd || "0",
    recentPurchases,
  };
};

/**
 * 👤 Get user purchase history
 */
export const getUserPurchases = async (wallet: string, limit: number = 50) => {
  return prisma.purchase.findMany({
    where: { userId: wallet.toLowerCase() },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};