import { contracts } from "../../config/contracts";
import { ethers } from "ethers";
import { ChainAdapter } from "./base";
import AirdropABI from "../../abis/Airdrop.json";

const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const contract = new ethers.Contract(
  process.env.BSC_AIRDROP!,
  AirdropABI,
  wallet
);

export class BscAdapter implements ChainAdapter {
  async claim(amount: number, proof: string[]) {
    const tx = await contract.claim(amount, proof);
    return await tx.wait();
  }
}