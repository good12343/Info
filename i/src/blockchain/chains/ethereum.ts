import { ethers } from "ethers";
import { contracts } from "../../config/contracts";
import { ChainAdapter } from "./base";
import AirdropABI from "../../abis/Airdrop.json";

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const contract = new ethers.Contract(
  contracts.eth.airdrop, // تأكد أنه موجود في contracts.ts
  AirdropABI,
  wallet
);

export class EthereumAdapter implements ChainAdapter {
  async claim(amount: number, proof: string[]) {
    const tx = await contract.claim(amount, proof);
    return await tx.wait();
  }
}