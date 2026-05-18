import { prisma } from "../db/prisma";
import { calculateAirdrop } from "../engine/airdrop.rules";
import { UserCategory } from "@prisma/client";

/**
 * 🪂 Process airdrop allocation for a user
 */
export const processAirdrop = async (wallet: string, points: number) => {
  const normalizedWallet = wallet.toLowerCase();
  
  const calculation = calculateAirdrop({ wallet: normalizedWallet, points });
  if (!calculation.approved) {
    throw new Error(calculation.reason || "Airdrop not approved");
  }

  const user = await prisma.user.upsert({
    where: { wallet: normalizedWallet },
    update: {
      airdropPoints: points,
      airdropAllocated: calculation.tokens,
    },
    create: {
      wallet: normalizedWallet,
      airdropPoints: points,
      airdropAllocated: calculation.tokens,
      category: UserCategory.AIRDROP_ONLY
    }
  });

  // Sync category
  await syncUserCategory(normalizedWallet);

  return user;
};

/**
 * ✅ Record airdrop claim
 */
export const recordAirdropClaim = async (wallet: string, txHash: string) => {
  const normalizedWallet = wallet.toLowerCase();

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { wallet: normalizedWallet },
      data: {
        hasClaimedAirdrop: true,
        airdropClaimedAt: new Date(),
        airdropTxHash: txHash
      }
    });

    await tx.auditLog.create({
      data: {
        action: "AIRDROP_CLAIM",
        userId: normalizedWallet,
        txHash,
        metadata: { tokens: user.airdropAllocated }
      }
    });

    return user;
  });
};

/**
 * 🔄 Sync user category based on activity
 */
export const syncUserCategory = async (wallet: string) => {
  const user = await prisma.user.findUnique({
    where: { wallet: wallet.toLowerCase() },
    include: { _count: { select: { purchases: true } } }
  });

  if (!user) return;

  let category: UserCategory = UserCategory.NONE;
  const hasAirdrop = user.airdropPoints > 0;
  const hasPurchases = user._count.purchases > 0;

  if (hasAirdrop && hasPurchases) category = UserCategory.AIRDROP_BUYER;
  else if (hasAirdrop) category = UserCategory.AIRDROP_ONLY;
  else if (hasPurchases) category = UserCategory.BUYER_ONLY;

  await prisma.user.update({
    where: { wallet: user.wallet },
    data: { category }
  });
};
