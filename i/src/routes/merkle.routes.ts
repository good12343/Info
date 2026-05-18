import { Router } from "express";
import { merkleController } from "../controllers/merkle.controller";
import { requireGov } from "../middleware/roles";
import { rateLimit } from "../middleware/rate-limit";

const router = Router();

// Admin endpoints
router.post("/build", requireGov, merkleController.buildMerkle);

// Public endpoints
router.get("/proof/:wallet", rateLimit({ windowMs: 60000, max: 30 }), merkleController.getProof);
router.get("/snapshot", rateLimit({ windowMs: 60000, max: 20 }), merkleController.getSnapshot);
router.get("/snapshots", rateLimit({ windowMs: 60000, max: 20 }), merkleController.getSnapshots);

export default router;
