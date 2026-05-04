//////////////////////////////////////////////////////
// 🌍 Global Types (Web3 Airdrop System)
//////////////////////////////////////////////////////

declare global {

  // 🔐 Express Request extension
  namespace Express {
    interface Request {
      wallet?: string;
      userId?: string;
      ipAddress?: string;
      chain?: "somi" | "ethereum" | "bsc";
    }
  }

  // 🌐 Supported chains
  type ChainName = "somi" | "ethereum" | "bsc";

  // 📦 Claim request type
  interface ClaimRequest {
    wallet: string;
    amount: number;
    proof: string[];
    chain: ChainName;
  }

  // 🧠 Airdrop validation result
  interface ValidationResult {
    valid: boolean;
    reason?: string | null;
  }

  // ⛓️ Chain adapter interface
  interface ChainAdapter {
    claim(wallet: string, amount: number, proof: string[]): Promise<any>;
  }

  // 📊 Audit action types
  type AuditAction =
    | "CLAIM"
    | "SET_ROOT"
    | "BLOCK_USER"
    | "UNBLOCK_USER"
    | "EMERGENCY_PAUSE";
}

export {};