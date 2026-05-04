import { Router } from "express";
import { airdropController } from "../controllers/airdrop.controller";

const router = Router();

router.post("/", airdropController);

export default router;