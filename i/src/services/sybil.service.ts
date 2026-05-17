import { prisma } from "../db/prisma";

const CHAIN_ID = 11155111; // Sepolia

/**
 * 🛡️ Check if user is blocked (Sybil protection)
 */
export const checkSybil = async (wallet: string, ip: string) => {
  const normalizedWallet = wallet.toLowerCase();

  // Check user blocked status
  const user = await prisma.user.findUnique({
    where: { wallet: normalizedWallet },
  });

  if (user?.isBlocked) return false;

  // Check Sybil records
  const record = await prisma.sybilCheck.findFirst({
    where: { userId: normalizedWallet },
  });

  if (record?.blocked) return false;

  // Check IP-based abuse (same IP, multiple wallets)
  const ipBasedChecks = await prisma.sybilCheck.count({
    where: {
      ipAddress: ip,
      userId: { not: normalizedWallet },
    },
  });

  // Block if same IP used by 5+ different wallets
  if (ipBasedChecks >= 5) {
    await prisma.sybilCheck.create({
      data: {
        userId: normalizedWallet,
        ipAddress: ip,
        blocked: true,
        riskScore: 1.0,
      },
    });
    return false;
  }

  return true;
};

/**
 * 📝 Record Sybil check
 */
export const recordSybilCheck = async (
  wallet: string,
  ip: string,
  fingerprint?: string
) => {
  const normalizedWallet = wallet.toLowerCase();

  await prisma.sybilCheck.upsert({
    where: {
      id: (await prisma.sybilCheck.findFirst({
        where: { userId: normalizedWallet },
      }))?.id || "",
    },
    update: {
      ipAddress: ip,
      fingerprint: fingerprint || undefined,
      claimCount: { increment: 1 },
    },
    create: {
      userId: normalizedWallet,
      ipAddress: ip,
      fingerprint: fingerprint || null,
      claimCount: 1,
      riskScore: 0,
      blocked: false,
    },
  });
};

/**
 * 🔍 Get Sybil risk score
 */
export const getRiskScore = async (wallet: string): Promise<number> => {
  const normalizedWallet = wallet.toLowerCase();

  const record = await prisma.sybilCheck.findFirst({
    where: { userId: normalizedWallet },
  });

  return record?.riskScore || 0;
};