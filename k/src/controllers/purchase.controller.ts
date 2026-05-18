import { Request, Response } from "express";
import { 
  recordPurchase, 
  recordPurchaseClaim,
  getUserFullStatus 
} from "../services/purchase.service";

/**
 * POST /api/purchase/webhook
 */
export const purchaseWebhook = async (req: Request, res: Response) => {
  try {
    const { buyer, tokenAmount, price, currency, txHash } = req.body;
    const result = await recordPurchase({
      buyer,
      tokenAmount,
      price,
      currency,
      txHash
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/purchase/claim
 */
export const claimPurchaseTokens = async (req: Request, res: Response) => {
  try {
    const { wallet, txHash } = req.body;
    const result = await recordPurchaseClaim(wallet, txHash);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/purchase/status/:wallet
 */
export const userStatus = async (req: Request, res: Response) => {
  try {
    const wallet = req.params.wallet as string;
    const status = await getUserFullStatus(wallet);
    if (!status) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const purchaseController = {
  purchaseWebhook,
  claimPurchaseTokens,
  userStatus
};
