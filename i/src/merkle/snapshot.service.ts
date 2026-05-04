import { prisma } from "../db/prisma";

export const getAirdropSnapshot = async () => {
  return prisma.user.findMany({
    where: {
      airdropPoints: {
        gt: 0,
      },
      isEligible: true,
    },
    select: {
      wallet: true,
      tokensAllocated: true,
    },
  });
};