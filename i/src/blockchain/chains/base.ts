// base.ts
export interface ChainAdapter {
  claim(wallet: string, amount: number, proof: string[]): Promise<any>;
}