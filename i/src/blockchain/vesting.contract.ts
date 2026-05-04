import { ethers } from "ethers";
import { wallet } from "./provider";
import VestingABI from "../abis/Vesting.json";
import { contracts } from "../config/contracts";

// اختر الشبكة هنا أو لاحقًا من parameter
const chain = "somi";

export const vestingContract = new ethers.Contract(
  contracts[chain].vesting,
  VestingABI,
  wallet
);