import { ethers } from "ethers";
import { wallet } from "./provider";
import AirdropABI from "../abis/Airdrop.json";

export const airdropContract = new ethers.Contract(
  process.env.AIRDROP_ADDRESS!,
  AirdropABI,
  wallet
);