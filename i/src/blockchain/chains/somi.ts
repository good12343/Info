import { contracts } from "../../config/contracts";
import { ethers } from "ethers";
import AirdropABI from "../../abis/Airdrop.json";
import { ChainAdapter } from "./base";

// 🔐 حماية env
const RPC = process.env.SOMI_RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!RPC) throw new Error("SOMI_RPC is missing");
if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY is missing");

// Provider + Wallet
const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract instance
const contract = new ethers.Contract(
  contracts.somi.airdrop,
  AirdropABI,
  wallet
);

// ✅ هذا هو المهم: لازم يكون Adapter مُصدر
export class SomiAdapter implements ChainAdapter {
  async claim(amount: number, proof: string[]) {
    const tx = await contract.claim(amount, proof);
    return await tx.wait();
  }

  // (اختياري) إضافة helper للمستقبل
  async getInfo() {
    return await contract.getInfo();
  }
}