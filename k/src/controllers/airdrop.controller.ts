import { Request, Response } from "express";
import { processAirdrop, recordAirdropClaim } from "../services/airdrop.service";

/**
 * POST /api/airdrop/allocate
 */
export const allocateAirdrop = async (req: Request, res: Response) => {
  try {
    const { wallet, points } = req.body;
    const result = await processAirdrop(wallet, points);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/airdrop/claim
 */
export const claimAirdrop = async (req: Request, res: Response) => {
  try {
    const { wallet, txHash } = req.body;
    const result = await recordAirdropClaim(wallet, txHash);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const airdropController = {
  allocateAirdrop,
  claimAirdrop
};
