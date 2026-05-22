import { Router } from "express";
import {
  checkEligibility,
  recordAirdropClaim,
  getStats,
  getClaimStatusHandler,
} from "../controllers/airdrop.controller";

const router = Router();

// ── Eligibility ──
router.get("/eligibility/:wallet", checkEligibility);

// ── Claim ──
router.post("/claim", recordAirdropClaim);

// ── Status ──
router.get("/claim-status/:wallet", getClaimStatusHandler);

// ── Stats ──
router.get("/stats", getStats);

export default router;