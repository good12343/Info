// src/controllers/claim.controller.ts

import { Request, Response } from "express";
import { getChain } from "../blockchain/factory";
import { claimService } from "../services/claim.service";

export const claim = async (req: Request, res: Response) => {
  try {
    const { wallet, amount, proof, chain } = req.body;

    // 1. اختيار الشبكة 👇 (هنا بالضبط)
    const selectedChain = getChain(chain);

    // 2. تمريرها إلى الـ service
    const result = await claimService.processClaim(wallet, req.ip);

    res.json({
      success: true,
      txHash: result.txHash,
    });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
export const claimController = { claim };