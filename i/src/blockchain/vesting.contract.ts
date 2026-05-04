import { ethers } from "ethers";
import { wallet } from "./provider";
import VestingABI from "../abi/Vesting.json";

export const vestingContract = new ethers.Contract(
  process.env.VESTING_ADDRESS!,
  VestingABI,
  wallet
);