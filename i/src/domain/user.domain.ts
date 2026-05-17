export type UserDomain = {
  wallet: string;
  totalBought: number;
  airdropPoints: number;
  tokensAllocated: string;   // BigInt as string
  tokensBought: string;      // BigInt as string
  vestedTokens: string;      // BigInt as string
  claimableTokens: string;   // BigInt as string
  category: string;           // AIRDROP_ONLY, AIRDROP_BUYER, BUYER_ONLY, NONE
  tier: string;              // BRONZE, SILVER, GOLD, PLATINUM
  chainId: number;            // 11155111 for Sepolia
};

/**
 * ✅ Check if user is eligible for airdrop
 */
export const isEligibleForAirdrop = (user: UserDomain): boolean => {
  return (
    user.airdropPoints > 0 &&
    BigInt(user.tokensAllocated || "0") > 0n &&
    !user.category?.includes("BLOCKED")
  );
};

/**
 * 🧮 Calculate user power score
 */
export const calculateUserPower = (user: UserDomain): number => {
  return user.totalBought + user.airdropPoints;
};

/**
 * 💰 Calculate total tokens (allocated + bought)
 */
export const calculateTotalTokens = (user: UserDomain): string => {
  const allocated = BigInt(user.tokensAllocated || "0");
  const bought = BigInt(user.tokensBought || "0");
  return (allocated + bought).toString();
};

/**
 * 📊 Get user summary
 */
export const getUserSummary = (user: UserDomain) => {
  const totalTokens = calculateTotalTokens(user);
  const power = calculateUserPower(user);

  return {
    wallet: user.wallet,
    category: user.category,
    tier: user.tier,
    power,
    totalTokens,
    airdrop: {
      points: user.airdropPoints,
      tokens: user.tokensAllocated,
    },
    purchase: {
      totalBought: user.totalBought,
      tokens: user.tokensBought,
    },
    vesting: {
      vested: user.vestedTokens,
      claimable: user.claimableTokens,
    },
    chainId: user.chainId,
  };
};