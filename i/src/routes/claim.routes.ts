import { Router } from "express";
import { claimController } from "../controllers/claim.controller";
import { rateLimit } from "../middleware/rate-limit";

const router = Router();

// Public endpoints with rate limiting
router.get("/status/:wallet", rateLimit({ windowMs: 60000, max: 30 }), claimController.getClaimStatus);
router.post("/submit", rateLimit({ windowMs: 60000, max: 10 }), claimController.submitClaim);
router.post("/confirm", rateLimit({ windowMs: 60000, max: 10 }), claimController.confirmClaim);

export default router;
