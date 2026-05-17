import { prisma } from "../db/prisma";

const CHAIN_ID = 11155111; // Sepolia

/**
 * 📝 Log an action to the audit log
 */
export const logAction = async (data: {
  action: string;
  userId?: string;
  txHash?: string;
  ip?: string;
  chainId?: number;
  metadata?: any;
}) => {
  await prisma.auditLog.create({
    data: {
      action: data.action,
      userId: data.userId?.toLowerCase(),
      txHash: data.txHash,
      ip: data.ip,
      chainId: data.chainId || CHAIN_ID,
      metadata: data.metadata || {},
    },
  });
};

/**
 * 📊 Get audit logs for a user
 */
export const getUserAuditLogs = async (wallet: string, limit: number = 50) => {
  return prisma.auditLog.findMany({
    where: { userId: wallet.toLowerCase() },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

/**
 * 📈 Get audit statistics
 */
export const getAuditStats = async () => {
  const stats = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: { id: true },
    where: { chainId: CHAIN_ID },
  });

  return stats.map((s) => ({
    action: s.action,
    count: s._count.id,
  }));
};