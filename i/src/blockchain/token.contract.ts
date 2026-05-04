import { ethers } from "ethers";
import { wallet } from "./provider";
import TokenABI from "../abi/Token.json";

export const tokenContract = new ethers.Contract(
  process.env.TOKEN_ADDRESS!,
  TokenABI,
  wallet
);