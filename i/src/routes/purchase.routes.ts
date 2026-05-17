import { Router } from "express";
import { rateLimit } from "../middleware/rate-limit";
import { requireAdmin } from "../middleware/roles";
import { purchaseController } from "../controllers/purchase.controller";

const router = Router();

// Webhook for blockchain events (internal use)
router.post("/webhook", purchaseController.purchaseWebhook);

// Public routes
router.get("/stats", rateLimit({ windowMs: 60000, max: 20 }), purchaseController.purchaseStats);
router.get("/sale-info", rateLimit({ windowMs: 60000, max: 20 }), purchaseController.saleInfo);
router.get("/history/:wallet", rateLimit({ windowMs: 60000, max: 30 }), purchaseController.userPurchaseHistory);

// Admin routes
router.post("/sync", requireAdmin, purchaseController.syncPurchases);

export default router;