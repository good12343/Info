import { prisma } from "../db/prisma";
import { calculateAirdrop } from "../engine/airdrop.rules";
import { UserCategory } from "@prisma/client";
import { generateProof } from "../merkle/proof.service";
import { buildMerkleTree } from "../merkle/tree.service";

const DECIMALS = 18;
const CHAIN_ID = 11155111; // Sepolia

/**
 * تحويل FOR إلى wei
 */
const toWei = (tokens: string | number): string => {
  return (BigInt(Math.floor(Number(tokens) * 10 ** DECIMALS))).toString();
};

/**
 * 🪂 Process airdrop allocation for a user
 * 
 * يولد Merkle Proof ويخزن wei
 */
export const processAirdrop = async (wallet: string, points: number) => {
  const normalizedWallet = wallet.toLowerCase();
  
  const calculation = calculateAirdrop({ wallet: normalizedWallet, points });
  if (!calculation.approved) {
    throw new Error(calculation.reason || "Airdrop not approved");
  }

  // تحويل التوكنز إلى wei
  const tokensWei = toWei(calculation.tokens);

  // جلب جميع المستخدمين لبناء Merkle Tree
  const allUsers = await prisma.user.findMany({
    where: { airdropPoints: { gt: 0 } },
    select: { wallet: true, airdropAllocatedWei: true },
  });

  // بناء Merkle Tree
  const entries = allUsers.map((u) => ({
    wallet: u.wallet,
    amount: u.airdropAllocatedWei || "0",
  }));

  // إضافة المستخدم الحالي إذا لم يكن موجوداً
  if (!entries.find((e) => e.wallet === normalizedWallet)) {
    entries.push({ wallet: normalizedWallet, amount: tokensWei });
  }

  // توليد Merkle Proof
  const merkleData = generateProof(normalizedWallet, tokensWei, entries, CHAIN_ID);

  if (!merkleData) {
    throw new Error("Failed to generate Merkle proof");
  }

  const user = await prisma.user.upsert({
    where: { wallet: normalizedWallet },
    update: {
      airdropPoints: points,
      airdropAllocated: calculation.tokens,
      airdropAllocatedWei: tokensWei,
      merkleProof: merkleData.proof,
      merkleLeaf: merkleData.leaf,
      chainId: CHAIN_ID,
    },
    create: {
      wallet: normalizedWallet,
      airdropPoints: points,
      airdropAllocated: calculation.tokens,
      airdropAllocatedWei: tokensWei,
      merkleProof: merkleData.proof,
      merkleLeaf: merkleData.leaf,
      chainId: CHAIN_ID,
      category: UserCategory.AIRDROP_ONLY,
    },
  });

  // Sync category
  await syncUserCategory(normalizedWallet);

  return user;
};

/**
 * 🔍 Get airdrop eligibility for a user
 * 
 * يُرجع: amount (wei) + proof + alreadyClaimed
 */
export const getAirdropEligibility = async (wallet: string) => {
  const normalizedWallet = wallet.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { wallet: normalizedWallet },
  });

  if (!user || user.airdropAllocatedWei === "0") {
    return {
      eligible: false,
      amount: "0",
      proof: [],
      alreadyClaimed: false,
      message: "Address not eligible for airdrop",
    };
  }

  return {
    eligible: true,
    amount: user.airdropAllocatedWei,
    proof: user.merkleProof,
    alreadyClaimed: user.hasClaimedAirdrop,
  };
};

/**
 * ✅ Record airdrop claim
 * 
 * يستقبل amount (wei) اختياري للتحقق
 */
export const recordAirdropClaim = async (
  wallet: string,
  txHash: string,
  amountWei?: string
) => {
  const normalizedWallet = wallet.toLowerCase();

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { wallet: normalizedWallet },
    });

    if (!user) throw new Error("User not found");
    if (user.hasClaimedAirdrop) throw new Error("Airdrop already claimed");

    // التحقق من تطابق amount (إذا وُفر)
    if (amountWei && amountWei !== user.airdropAllocatedWei) {
      throw new Error("Claim amount mismatch");
    }

    // إنشاء سجل المطالبة
    await tx.airdropClaim.create({
      data: {
        userId: normalizedWallet,
        txHash,
        amountWei: user.airdropAllocatedWei,
        amountFor: user.airdropAllocated,
      },
    });

    const updatedUser = await tx.user.update({
      where: { wallet: normalizedWallet },
      data: {
        hasClaimedAirdrop: true,
        airdropClaimedAt: new Date(),
        airdropTxHash: txHash,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "AIRDROP_CLAIM",
        userId: normalizedWallet,
        txHash,
        metadata: {
          amountWei: user.airdropAllocatedWei,
          amountFor: user.airdropAllocated.toString(),
        },
      },
    });

    return updatedUser;
  });
};

/**
 * 🔄 Sync user category based on activity
 */
export const syncUserCategory = async (wallet: string) => {
  const user = await prisma.user.findUnique({
    where: { wallet: wallet.toLowerCase() },
    include: { _count: { select: { purchases: true } } },
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
    data: { category },
  });
};