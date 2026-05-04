import { contracts } from "../../config/contracts";
import { ethers } from "ethers";
import { ChainAdapter } from "./base";
import AirdropABI from "../../abis/Airdrop.json";

// 🔐 حماية env
const RPC = process.env.BSC_RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!RPC) throw new Error("BSC_RPC is missing");
if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY is missing");

// Provider + Wallet
const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract instance (🔴 FIX هنا)
const contract = new ethers.Contract(
  contracts.bsc.airdrop,
  AirdropABI,
  wallet
);

export class BscAdapter implements ChainAdapter {
  async claim(amount: number, proof: string[]) {
    const tx = await contract.claim(amount, proof);
    return await tx.wait();
  }
}