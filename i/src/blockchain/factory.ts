// factory.ts
import { SomiAdapter } from "./chains/somi";
import { EthereumAdapter } from "./chains/ethereum";
import { BscAdapter } from "./chains/bsc";

export const getChain = (chain: string) => {
  switch (chain) {
    case "somi":
      return new SomiAdapter();
    case "ethereum":
      return new EthereumAdapter();
    case "bsc":
      return new BscAdapter();
    default:
      throw new Error("Unsupported chain");
  }
};