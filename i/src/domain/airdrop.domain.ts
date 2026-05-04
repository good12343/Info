export type AirdropInput = {
  wallet: string;
  points: number;
  totalBought: number;
};

export const calculateAirdropAmount = (input: AirdropInput): number => {
  let base = input.points / 10;

  // bonus logic
  if (input.totalBought > 1000) {
    base *= 1.5;
  }

  return Math.floor(base);
};

export const isAirdropValid = (input: AirdropInput): boolean => {
  return input.points > 0;
};