import { hashLeaf } from "../merkle/hash.service";

export const generateProof = (wallet: string, amount: number) => {
  const leaf = hashLeaf(wallet, amount);

  // في النظام الحقيقي: تستخدم Merkle Tree library
  // هنا simplified version للربط

  return [leaf];
};