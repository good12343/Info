import { hashLeaf } from "./hash.service";

export const generateProof = (
  wallet: string,
  amount: number,
  all: { wallet: string; amount: number }[]
) => {
  const leaf = hashLeaf(wallet, amount);

  const proof = all
    .filter((u) => u.wallet !== wallet)
    .map((u) => hashLeaf(u.wallet, u.amount));

  return {
    leaf,
    proof,
  };
};