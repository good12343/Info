import { Router } from "express";
import {
  categoryStatsController,
  tierStatsController,
  usersByCategoryController,
  userReportController,
  classifyUserController,
  dashboardController,
} from "../controllers/reports.controller";
import { rateLimit } from "../middleware/rate-limit";

const router = Router();

// Public routes with rate limiting
router.get("/dashboard", rateLimit({ windowMs: 60000, max: 30 }), dashboardController);
router.get("/categories", rateLimit({ windowMs: 60000, max: 30 }), categoryStatsController);
router.get("/tiers", rateLimit({ windowMs: 60000, max: 30 }), tierStatsController);
router.get("/users", rateLimit({ windowMs: 60000, max: 20 }), usersByCategoryController);
router.get("/user/:wallet", rateLimit({ windowMs: 60000, max: 30 }), userReportController);

// Admin routes
router.post("/classify/:wallet", classifyUserController);

export default router;