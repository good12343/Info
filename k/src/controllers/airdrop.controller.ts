import { Request, Response } from "express";
import {
  processAirdrop,
  recordAirdropClaim,
  getAirdropEligibility,
} from "../services/airdrop.service";

/**
 * POST /api/airdrop/allocate
 * Admin: تخصيص إنزال جوي لمستخدم
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
 * GET /api/airdrop/eligibility?address=0x...
 * 
 * يُرجع للـ Frontend:
 * {
 *   eligible: true,
 *   amount: "100000000000000000000",  // wei
 *   proof: ["0xabc...", "0xdef..."],  // Merkle Proof
 *   alreadyClaimed: false
 * }
 */
export const getEligibility = async (req: Request, res: Response) => {
  try {
    const address = req.query.address as string;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Address parameter is required",
      });
    }

    const result = await getAirdropEligibility(address);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/airdrop/claim
 * 
 * يستقبل من Frontend:
 * {
 *   wallet: "0x...",
 *   txHash: "0x...",
 *   amount: "100000000000000000000"  // wei (اختياري للتحقق)
 * }
 */
export const claimAirdrop = async (req: Request, res: Response) => {
  try {
    const { wallet, txHash, amount } = req.body;

    if (!wallet || !txHash) {
      return res.status(400).json({
        success: false,
        error: "Wallet and txHash are required",
      });
    }

    const result = await recordAirdropClaim(wallet, txHash, amount);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const airdropController = {
  allocateAirdrop,
  getEligibility,
  claimAirdrop,
};