import { prisma } from "../db/prisma";
import { calculateAirdrop } from "../engine/airdrop.rules";

export const processAirdrop = async (wallet: string, points: number) => {
  // 1. جلب بيانات المستخدم
  const user = await prisma.user.findUnique({
    where: { wallet },
  });

  // 2. تشغيل Rules Engine (العقل)
  const result = calculateAirdrop({
    wallet,
    points,
    totalBought: user?.totalBought || 0,
  });

  // 3. إذا مرفوض
  if (!result.approved) {
    return {
      status: "rejected",
      wallet,
      reason: result.reason,
    };
  }

  // 4. تحديث أو إنشاء المستخدم
  const updatedUser = await prisma.user.upsert({
    where: { wallet },
    update: {
      airdropPoints: { increment: points },
      tokensAllocated: { increment: result.tokens },
    },
    create: {
      wallet,
      airdropPoints: points,
      tokensAllocated: result.tokens,
    },
  });

  // 5. نتيجة نهائية
  return {
    status: "approved",
    wallet,
    tokens: result.tokens,
    user: updatedUser,
  };
};