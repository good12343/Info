import { Router } from "express";
import { airdropController } from "../controllers/airdrop.controller";

const router = Router();

router.post("/allocate", airdropController.allocateAirdrop);
router.post("/claim", airdropController.claimAirdrop);

export default router;
