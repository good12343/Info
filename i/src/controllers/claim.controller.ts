import { Request, Response } from "express";
import { processClaim } from "../services/claim.service";

export const claimController = async (req: Request, res: Response) => {
  const { wallet } = req.body;

  const result = await processClaim(wallet);

  res.json(result);
};