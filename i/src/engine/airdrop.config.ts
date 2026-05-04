export const airdropConfig = {
  baseRate: 10, // 10 points = 1 token

  maxPointsPerUser: 10000,

  multipliers: {
    hasBought: 1.2,
    default: 1,
  },

  rules: {
    minPoints: 1,
    antiAbuseMax: 10000,
  },
};