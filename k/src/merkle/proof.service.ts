import { MerkleTree } from "merkletreejs";
import { hashLeaf } from "./hash.service";

interface AirdropEntry {
  wallet: string;
  amount: string | number | bigint;
  chainId?: number;
}

export interface ProofResult {
  leaf: string;
  proof: string[];
  root: string;
}

/**
 * Generate a Merkle proof for a specific user
 */
export const generateProof = (
  wallet: string,
  amount: string | number | bigint,
  allEntries: AirdropEntry[],
  chainId: number = 11155111
): ProofResult | null => {
  const { buildMerkleTree } = require("./tree.service");
  
  const result = buildMerkleTree(allEntries, chainId);
  if (!result) return null;

  const { tree, root } = result;
  const leaf = hashLeaf(wallet, amount, chainId);
  const leafBuffer = Buffer.from(leaf.slice(2), "hex");

  const proof = tree.getProof(leafBuffer).map((p: any) => "0x" + p.data.toString("hex"));

  return {
    leaf,
    proof,
    root,
  };
};

/**
 * Generate proofs for all users (batch)
 */
export const generateAllProofs = (
  allEntries: AirdropEntry[],
  chainId: number = 11155111
): Map<string, ProofResult> => {
  const { buildMerkleTree } = require("./tree.service");
  
  const result = buildMerkleTree(allEntries, chainId);
  if (!result) return new Map();

  const { tree, root } = result;
  const proofs = new Map<string, ProofResult>();

  for (const entry of allEntries) {
    const leaf = hashLeaf(entry.wallet, entry.amount, chainId);
    const leafBuffer = Buffer.from(leaf.slice(2), "hex");
    const proof = tree.getProof(leafBuffer).map((p: any) => "0x" + p.data.toString("hex"));

    proofs.set(entry.wallet.toLowerCase(), {
      leaf,
      proof,
      root,
    });
  }

  return proofs;
};