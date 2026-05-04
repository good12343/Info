import { ethers } from "ethers";
import { wallet } from "./provider";
import AirdropABI from "../abis/Airdrop.json";
import { contracts } from "../config/contracts";

// اختر الشبكة هنا أو من parameter لاحقاً
const chain = "somi";

export const airdropContract = new ethers.Contract(
  contracts[chain].airdrop,
  AirdropABI,
  wallet
);