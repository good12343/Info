import { Router } from "express";
import { claimController } from "../controllers/claim.controller";

const router = Router();

// POST /claim
router.post("/", claimController);

export default router;