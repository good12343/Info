import { ethers } from "ethers";
import { wallet, provider, chain, config } from "./provider";
import AirdropABI from "../abis/Airdrop.json";

// Read-only contract
export const airdropContractRead = new ethers.Contract(
  config.airdrop,
  AirdropABI,
  provider
);

// Write contract (requires admin wallet)
export const airdropContractWrite = wallet 
  ? new ethers.Contract(config.airdrop, AirdropABI, wallet)
  : null;

// Helper functions
export const getAirdropState = async () => {
  const [merkleRoot, claimStart, claimEnd, maxAllocation, totalAllocated, finalized, paused] = 
    await Promise.all([
      airdropContractRead.merkleRoot(),
      airdropContractRead.claimStart(),
      airdropContractRead.claimEnd(),
      airdropContractRead.maxAllocation(),
      airdropContractRead.totalAllocated(),
      airdropContractRead.finalized(),
      airdropContractRead.paused(),
    ]);
  
  return {
    merkleRoot,
    claimStart: Number(claimStart),
    claimEnd: Number(claimEnd),
    maxAllocation: maxAllocation.toString(),
    totalAllocated: totalAllocated.toString(),
    finalized,
    paused,
  };
};

export const hasUserClaimed = async (address: string): Promise<boolean> => {
  return await airdropContractRead.claimed(address);
};