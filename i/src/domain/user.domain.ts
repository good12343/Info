export type UserDomain = {
  wallet: string;
  totalBought: number;
  airdropPoints: number;
  tokensAllocated: number;
  frozenTokens: number;
  unlockedTokens: number;
};

export const isEligibleForAirdrop = (user: UserDomain): boolean => {
  return user.airdropPoints > 0 && user.tokensAllocated > 0;
};

export const calculateUserPower = (user: UserDomain): number => {
  return user.totalBought + user.airdropPoints;
};