import { Request, Response } from "express";
import { processAirdrop } from "../services/airdrop.service";

export const airdropController = async (req: Request, res: Response) => {
  const { wallet, points } = req.body;

  const result = await processAirdrop(wallet, points);

  res.json(result);
};