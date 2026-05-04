// src/services/sybil.service.ts
import { prisma } from "../db/prisma";

export const checkSybil = async (wallet: string, ip: string) => {
  const record = await prisma.sybilCheck.findFirst({
    where: { userId: wallet },
  });

  if (record?.blocked) return false;

  return true;
};