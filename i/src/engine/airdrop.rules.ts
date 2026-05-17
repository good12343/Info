import { airdropConfig } from "./airdrop.config";

interface AirdropInput {
  wallet: string;
  points: number;
  totalBought?: number;
}

interface AirdropResult {
  approved: boolean;
  tokens: number;
  reason?: string;
}

export const calculateAirdrop = (input: AirdropInput): AirdropResult => {
  const { points, totalBought = 0 } = input;
  const cfg = airdropConfig;

  // Rule checks
  if (points < cfg.rules.minPoints) {
    return { approved: false, tokens: 0, reason: "Too few points" };
  }

  if (points > cfg.rules.antiAbuseMax) {
    return { approved: false, tokens: 0, reason: "Abuse detected" };
  }

  // Multiplier logic
  const multiplier = totalBought > 0 ? cfg.multipliers.hasBought : cfg.multipliers.default;
  const tokens = Math.floor((points / cfg.baseRate) * multiplier);

  return { approved: true, tokens };
};