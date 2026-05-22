import { Router, Request, Response, NextFunction } from "express";
import { adminController } from "../controllers/admin.controller";

const router = Router();

// Simple admin auth middleware (replace with your actual roles middleware)
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.wallet) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Add your role check logic here
  next();
};

// ── Tasks ──
router.get("/tasks", requireAdmin, adminController.listAllTasks);
router.post("/tasks", requireAdmin, adminController.createTask);
router.put("/tasks/:id", requireAdmin, adminController.updateTask);
router.delete("/tasks/:id", requireAdmin, adminController.deleteTask);
router.post("/tasks/:id/toggle", requireAdmin, adminController.toggleTask);

// ── User Tasks ──
router.get("/user-tasks", requireAdmin, adminController.listUserTasks);
router.post("/user-tasks/:id/verify", requireAdmin, adminController.verifyUserTask);
router.post("/user-tasks/:id/reject", requireAdmin, adminController.rejectUserTask);

// ── Review Queue ──
router.get("/review-queue", requireAdmin, adminController.getReviewQueue);
router.post("/review-queue/:id/approve", requireAdmin, adminController.approveReview);
router.post("/review-queue/:id/reject", requireAdmin, adminController.rejectReview);

// ── Dashboard ──
router.get("/dashboard", requireAdmin, adminController.getDashboardStats);

// ═════════════════════════════════════════════
// 🌳 MERKLE ADMIN ROUTES (NEW)
// ═════════════════════════════════════════════

// Trigger full rebuild + sync
router.post("/rebuild-airdrop", requireAdmin, adminController.rebuildAirdrop);

// Sync root to contract (or check status)
router.post("/sync-merkle-root", requireAdmin, adminController.syncMerkleRoot);

// Get current Merkle status
router.get("/merkle-status", requireAdmin, adminController.getMerkleStatus);

// Get job history
router.get("/merkle-jobs", requireAdmin, adminController.getMerkleJobs);

export default router;