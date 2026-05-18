export const contracts = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpc: process.env.SEPOLIA_RPC || "https://rpc.sepolia.org",
    token: process.env.TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
    airdrop: process.env.AIRDROP_ADDRESS || "0x0000000000000000000000000000000000000000",
    vesting: process.env.VESTING_ADDRESS || "0x0000000000000000000000000000000000000000",
    priceOracle: process.env.PRICE_ORACLE_ADDRESS || "0x0000000000000000000000000000000000000000",
    sale: process.env.SALE_ADDRESS || "0x0000000000000000000000000000000000000000",
  },
} as const;

export type ChainKey = keyof typeof contracts;
export const DEFAULT_CHAIN: ChainKey = "sepolia";
