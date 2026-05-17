import { Router } from "express";
import { rateLimit } from "../middleware/rate-limit";
import { requireGov } from "../middleware/roles";

const router = Router();

// Build Merkle tree (admin only)
router.post("/build", requireGov, async (req, res) => {
  try {
    // Implementation in merkle.controller.ts
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: "Failed to build tree" });
  }
});

// Get proof for a wallet
router.get("/proof/:wallet", rateLimit({ windowMs: 60000, max: 30 }), async (req, res) => {
  try {
    const { wallet } = req.params;
    // Implementation in merkle.controller.ts
    res.json({ status: "ok", wallet });
  } catch (error) {
    res.status(500).json({ error: "Failed to get proof" });
  }
});

// Get active snapshot
router.get("/snapshot", rateLimit({ windowMs: 60000, max: 20 }), async (req, res) => {
  try {
    // Implementation in merkle.controller.ts
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: "Failed to get snapshot" });
  }
});

// Get snapshot history
router.get("/snapshots", rateLimit({ windowMs: 60000, max: 20 }), async (req, res) => {
  try {
    // Implementation in merkle.controller.ts
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: "Failed to get snapshots" });
  }
});

export default router;