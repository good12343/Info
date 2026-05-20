// src/routes/admin.routes.ts
import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireGov, requireOperator } from "../middleware/roles";

const router = Router();

// 🛡️ كل الـ routes تحتاج Governance أو Admin role من الـ Contract
router.use(requireGov); // ← يتحقق من الـ Blockchain مباشرة

// ─── Task Management ────────────────────────────────────────────────────────
router.get("/tasks", adminController.listAllTasks);
router.post("/tasks", adminController.createTask);
router.put("/tasks/:id", adminController.updateTask);
router.delete("/tasks/:id", adminController.deleteTask);
router.patch("/tasks/:id/toggle", adminController.toggleTask);

// ─── User Task Management ───────────────────────────────────────────────────
router.get("/user-tasks", adminController.listUserTasks);
router.post("/user-tasks/:id/verify", adminController.verifyUserTask);
router.post("/user-tasks/:id/reject", adminController.rejectUserTask);

// ─── Review Queue ───────────────────────────────────────────────────────────
router.get("/review-queue", adminController.getReviewQueue);
router.post("/review-queue/:id/approve", adminController.approveReview);
router.post("/review-queue/:id/reject", adminController.rejectReview);

// ─── Stats ──────────────────────────────────────────────────────────────────
router.get("/stats", adminController.getDashboardStats);

export default router;
