import { airdropConfig } from "./airdrop.config";

export const calculateAirdrop = (input: {
  wallet: string;
  points: number;
  totalBought?: number;
}) => {
  const { points, totalBought = 0 } = input;

  const cfg = airdropConfig;

  // ❗ Rule check (data-driven)
  if (points < cfg.rules.minPoints) {
    return { approved: false, tokens: 0, reason: "Too few points" };
  }

  if (points > cfg.rules.antiAbuseMax) {
    return { approved: false, tokens: 0, reason: "Abuse detected" };
  }

  // 🧠 multiplier (config-based)
  const multiplier =
    totalBought > 0
      ? cfg.multipliers.hasBought
      : cfg.multipliers.default;

  const tokens = Math.floor((points / cfg.baseRate) * multiplier);

  return {
    approved: true,
    tokens,
  };
};