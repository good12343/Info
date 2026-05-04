// src/services/audit.service.ts
import { prisma } from "../db/prisma";

export const logAction = async (data: {
  action: string;
  userId?: string;
  txHash?: string;
  ip?: string;
  metadata?: any;
}) => {
  await prisma.auditLog.create({
    data,
  });
};