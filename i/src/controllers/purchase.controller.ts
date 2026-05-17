import { Request, Response } from "express";
import { 
  recordPurchase, 
  syncPastPurchases, 
  getPurchaseStats, 
  getUserPurchases 
} from "../services/purchase.service";
import { getSaleInfo, getUserPurchase } from "../blockchain/sale.contract";
import { logAction } from "../services/audit.service";
import { requireAdmin } from "../middleware/roles";

/**
 * POST /api/purchase/webhook
 * Webhook for blockchain events (called by event listener)
 */
export const purchaseWebhook = async (req: Request, res: Response) => {
  try {
    const { buyer, tokenAmount, price, currency, txHash, blockNumber } = req.body;

    if (!buyer || !tokenAmount || !txHash) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const result = await recordPurchase({
      buyer,
      tokenAmount,
      price: price || "0",
      currency: currency || "ETH",
      txHash,
      blockNumber: blockNumber || 0,
    });

    res.json(result);
  } catch (err: any) {
    console.error("Purchase webhook error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/purchase/sync
 * Sync past purchases from blockchain (admin only)
 */
export const syncPurchases = async (req: Request, res: Response) => {
  try {
    const { fromBlock, toBlock } = req.body;

    if (!fromBlock) {
      return res.status(400).json({ success: false, error: "Missing fromBlock" });
    }

    const result = await syncPastPurchases(fromBlock, toBlock);

    await logAction({
      action: "SYNC_PURCHASES",
      ip: req.ip,
      metadata: { fromBlock, toBlock, synced: result.synced },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Sync purchases error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/purchase/stats
 * Get purchase statistics
 */
export const purchaseStats = async (req: Request, res: Response) => {
  try {
    const stats = await getPurchaseStats();
    const saleInfo = await getSaleInfo();

    res.json({
      success: true,
      data: {
        ...stats,
        saleInfo: {
          tokensSold: saleInfo.tokensSold,
          maxTokens: saleInfo.maxTokens,
          progress: saleInfo.maxTokens !== "0" 
            ? (Number(saleInfo.tokensSold) / Number(saleInfo.maxTokens)) * 100 
            : 0,
          startTime: saleInfo.startTime,
          endTime: saleInfo.endTime,
          paused: saleInfo.paused,
        },
      },
    });
  } catch (err: any) {
    console.error("Purchase stats error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/purchase/history/:wallet
 * Get user purchase history
 */
export const userPurchaseHistory = async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const [purchases, blockchainInfo] = await Promise.all([
      getUserPurchases(wallet, limit),
      getUserPurchase(wallet),
    ]);

    res.json({
      success: true,
      data: {
        wallet: wallet.toLowerCase(),
        blockchain: blockchainInfo,
        purchases,
      },
    });
  } catch (err: any) {
    console.error("User purchase history error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/purchase/sale-info
 * Get sale contract info
 */
export const saleInfo = async (req: Request, res: Response) => {
  try {
    const info = await getSaleInfo();
    res.json({
      success: true,
      data: info,
    });
  } catch (err: any) {
    console.error("Sale info error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const purchaseController = {
  purchaseWebhook,
  syncPurchases,
  purchaseStats,
  userPurchaseHistory,
  saleInfo,
};