import { prisma } from "../db/prisma";
import { generateProof } from "./merkle.service";
import { airdropContract } from "../blockchain/airdrop.contract";
import { vestingContract } from "../blockchain/vesting.contract";
import { FEATURES } from "../config/features";
import { AirdropValidator } from "../engine/validation";
import { logAction } from "./audit.service";

export const processClaim = async (
  wallet: string,
  ip?: string
) => {

  // 1. 🔴 Emergency pause (أول شيء)
  if (FEATURES.EMERGENCY_PAUSE) {
    throw new Error("System paused");
  }

  // 2. جلب المستخدم
  const user = await prisma.user.findUnique({
    where: { wallet },
  });

  if (!user) {
    return { status: "error", message: "User not found" };
  }

  // 3. 🔴 Global claim check (مهم جدًا)
  if (user.hasClaimed) {
    throw new Error("Already claimed globally");
  }

  if (user.tokensAllocated <= 0) {
    return { status: "error", message: "No tokens to claim" };
  }

  // 4. توليد proof
  const proof = generateProof(wallet, user.tokensAllocated);

  // 5. validation
  const check = AirdropValidator.validate({
    user,
    proof,
    expired: false,
  });

  if (!check.valid) {
    throw new Error(check.reason!);
  }

  try {

    // 6. 🔗 blockchain claim
    const tx = await airdropContract.claim(
      wallet,
      user.tokensAllocated,
      proof
    );

    await tx.wait();

    // 7. vesting (اختياري)
    if (user.totalBought > 0) {
      await vestingContract.lock(wallet, user.tokensAllocated);
    }

    // 8. تحديث DB (GLOBAL STATE)
    await prisma.user.update({
      where: { wallet },
      data: {
        hasClaimed: true,
        claimedAt: new Date(),
        tokensAllocated: 0,
        vestedTokens: user.tokensAllocated,
      },
    });

    // 9. audit log
    await logAction({
      action: "CLAIM",
      userId: wallet,
      txHash: tx.hash,
      ip,
    });

    return {
      status: "success",
      txHash: tx.hash,
    };

  } catch (err: any) {
    return {
      status: "error",
      message: err.message,
    };
  }
};