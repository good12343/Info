import { ethers } from "ethers";
import { wallet } from "./provider";
import VestingABI from "../abis/Vesting.json";
import { contracts } from "../config/contracts";

export function getVestingContract(chain: "somi" | "eth" | "bsc") {
  const address = contracts[chain].vesting;

  if (!address) {
    throw new Error(`Vesting address missing for ${chain}`);
  }

  return new ethers.Contract(address, VestingABI, wallet);
}