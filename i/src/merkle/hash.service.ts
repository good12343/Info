import { createHash } from "crypto";

export const hashLeaf = (wallet: string, amount: number) => {
  return createHash("sha256")
    .update(wallet + ":" + amount)
    .digest("hex");
};