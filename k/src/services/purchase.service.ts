import { prisma } from "../db/prisma";
import { UserCategory } from "@prisma/client";
import { syncUserCategory } from "./airdrop.service";

/**
 * 🛒 Record a new purchase transaction
 */
export const recordPurchase = async (data: {
  buyer: string;
  tokenAmount: string;
  price: string;
  currency: string;
  txHash: string;
}) => {
  const normalizedBuyer = data.buyer.toLowerCase();

  return await prisma.$transaction(async (tx) => {
    // 1. Create purchase record
    const purchase = await tx.purchase.create({
      data: {
        userId: normalizedBuyer,
        txHash: data.txHash,
        amountUsd: data.price, // Assuming price passed is total USD for simplicity
        tokenAmount: data.tokenAmount,
        tokenPrice: "0", // Metadata
        currency: data.currency
      }
    });

    // 2. Update user aggregate state
    await tx.user.upsert({
      where: { wallet: normalizedBuyer },
      update: {
        totalBoughtUsd: { increment: data.price },
        purchaseCount: { increment: 1 }
      },
      create: {
        wallet: normalizedBuyer,
        totalBoughtUsd: data.price,
        purchaseCount: 1,
        category: UserCategory.BUYER_ONLY
      }
    });

    // 3. Log transaction
    await tx.auditLog.create({
      data: {
        action: "PURCHASE",
        userId: normalizedBuyer,
        txHash: data.txHash,
        metadata: { amountUsd: data.price, tokenAmount: data.tokenAmount }
      }
    });

    // 4. Sync category (Airdrop/Buyer/Both)
    await syncUserCategory(normalizedBuyer);

    return purchase;
  });
};

/**
 * ✅ Record token claim for purchases
 */
export const recordPurchaseClaim = async (wallet: string, txHash: string) => {
  const normalizedWallet = wallet.toLowerCase();

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { wallet: normalizedWallet },
      data: {
        hasClaimedTokens: true,
        tokensClaimedAt: new Date(),
        tokensClaimTxHash: txHash
      }
    });

    await tx.auditLog.create({
      data: {
        action: "PURCHASE_CLAIM",
        userId: normalizedWallet,
        txHash,
        metadata: { totalSpent: user.totalBoughtUsd }
      }
    });

    return user;
  });
};

/**
 * 📊 Get detailed user status (Airdrop + Purchase)
 */
export const getUserFullStatus = async (wallet: string) => {
  return await prisma.user.findUnique({
    where: { wallet: wallet.toLowerCase() },
    include: {
      purchases: {
        orderBy: { createdAt: "desc" }
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 10
      }
    }
  });
};
