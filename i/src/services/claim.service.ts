import { prisma } from "../db/prisma";
import { generateProof } from "./merkle.service";
import { airdropContract } from "../blockchain/airdrop.contract";
import { vestingContract } from "../blockchain/vesting.contract";

export const processClaim = async (wallet: string) => {
  // 1. جلب المستخدم
  const user = await prisma.user.findUnique({
    where: { wallet },
  });

  if (!user) {
    return { status: "error", message: "User not found" };
  }

  if (user.tokensAllocated <= 0) {
    return { status: "error", message: "No tokens to claim" };
  }

  // 2. توليد Merkle Proof
  const proof = generateProof(wallet, user.tokensAllocated);

  try {
    // 3. استدعاء عقد Airdrop (on-chain claim)
    const tx = await airdropContract.claim(
      wallet,
      user.tokensAllocated,
      proof
    );

    await tx.wait();

    // 4. إذا عندك vesting
    if (user.totalBought > 0) {
      await vestingContract.lock(wallet, user.tokensAllocated);
    }

    // 5. تحديث DB
    await prisma.user.update({
      where: { wallet },
      data: {
        tokensAllocated: 0,
        frozenTokens: user.tokensAllocated,
      },
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