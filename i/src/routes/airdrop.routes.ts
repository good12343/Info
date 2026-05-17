import { Router } from "express";
import { 
  airdropController, 
  eligibilityController, 
  buildTreeController,
  recordClaimController 
} from "../controllers/airdrop.controller";
import { rateLimit } from "../middleware/rate-limit";

const router = Router();

// Admin endpoints
router.post("/", airdropController);
router.post("/build-tree", buildTreeController);

// Public endpoints with rate limiting
router.get("/eligibility", rateLimit({ windowMs: 60000, max: 30 }), eligibilityController);
router.post("/record-claim", rateLimit({ windowMs: 60000, max: 10 }), recordClaimController);

export default router;