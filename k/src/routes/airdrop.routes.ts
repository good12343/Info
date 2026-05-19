import { Router } from "express";
import { airdropController } from "../controllers/airdrop.controller";

const router = Router();

// Admin: تخصيص إنزال جوي
router.post("/allocate", airdropController.allocateAirdrop);

// Frontend: جلب الأهلية (amount + proof)
router.get("/eligibility", airdropController.getEligibility);

// Frontend: تسجيل مطالبة بعد نجاحها على البلوكشين
router.post("/claim", airdropController.claimAirdrop);

export default router;