import { ethers } from "ethers";

export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  name: "Sepolia",
  rpcUrl: process.env.SEPOLIA_RPC || "https://rpc.sepolia.org",
  explorer: "https://sepolia.etherscan.io",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
};

export const getSepoliaProvider = () => {
  return new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
};

export const getSepoliaWallet = (privateKey: string) => {
  const provider = getSepoliaProvider();
  return new ethers.Wallet(privateKey, provider);
};