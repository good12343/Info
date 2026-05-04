import { hashLeaf } from "./hash.service";

export const buildMerkleTree = (data: { wallet: string; amount: number }[]) => {
  let level = data.map((u) => hashLeaf(u.wallet, u.amount));

  if (level.length === 0) return null;

  while (level.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 === level.length) {
        nextLevel.push(level[i]);
      } else {
        const combined = level[i] + level[i + 1];
        nextLevel.push(
          hashLeaf(combined, 0) // re-hash combined
        );
      }
    }

    level = nextLevel;
  }

  return {
    root: level[0],
    leaves: data,
  };
};