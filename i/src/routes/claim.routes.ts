import { Router } from "express";
import { rateLimit } from "../middleware/rate-limit";

const router = Router();

// Get claim status for a user
router.get("/status/:wallet", rateLimit({ windowMs: 60000, max: 30 }), async (req, res) => {
  try {
    const { wallet } = req.params;
    // Implementation in claim.controller.ts
    res.json({ status: "ok", wallet });
  } catch (error) {
    res.status(500).json({ error: "Failed to get claim status" });
  }
});

// Record a claim (called by frontend after tx confirmation)
router.post("/record", rateLimit({ windowMs: 60000, max: 10 }), async (req, res) => {
  try {
    const { wallet, txHash } = req.body;
    // Implementation in claim.controller.ts
    res.json({ status: "ok", wallet, txHash });
  } catch (error) {
    res.status(500).json({ error: "Failed to record claim" });
  }
});

// Get claim statistics
router.get("/stats", rateLimit({ windowMs: 60000, max: 20 }), async (req, res) => {
  try {
    // Implementation in claim.controller.ts
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;