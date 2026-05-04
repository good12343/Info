import { ethers } from "ethers";
import { ChainAdapter } from "./base";
import AirdropABI from "../abis/Airdrop.json";

const provider = new ethers.JsonRpcProvider(process.env.SOMI_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const contract = new ethers.Contract(
  process.env.SOMI_AIRDROP!,
  AirdropABI,
  wallet
);

export class SomiAdapter implements ChainAdapter {
  async claim(walletAddr: string, amount: number, proof: string[]) {
    const tx = await contract.claim(walletAddr, amount, proof);
    return await tx.wait();
  }
}