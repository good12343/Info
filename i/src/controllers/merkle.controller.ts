import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { buildMerkleTree } from "../merkle/tree.service";
import { generateAllProofs } from "../merkle/proof.service";
import { createSnapshot, getActiveSnapshot, getSnapshotHistory } from "../merkle/snapshot.service";
import { logAction } from "../services/audit.service";
import { UserCategory } from "@prisma/client";

const CHAIN_ID = 11155111; // Sepolia

/**
 * POST /api/merkle/build
 * Build Merkle tree from eligible users (admin only)
 */
export const buildMerkle = async (req: Request, res: Response) => {
  try {
    const { category } = req.body;
    const userCategory = category && Object.values(UserCategory).includes(category) 
      ? category 
      : undefined;

    // Get eligible users
    const eligibleUsers = await prisma.user.findMany({
      where: {
        isEligible: true,
        isBlocked: false,
        ...(userCategory && { category: userCategory }),
      },
    });

    if (eligibleUsers.length === 0) {
      return res.status(400).json({ success: false, error: "No eligible users found" });
    }

    // Build snapshot
    const entries = eligibleUsers.map((u) => ({
      wallet: u.wallet,
      amount: u.amount || u.tokensAllocated || "0",
    }));

    const result = await createSnapshot(
      entries,
      userCategory || UserCategory.AIRDROP_ONLY
    );

    if (result.status === "error") {
      return res.status(500).json({ success: false, error: result.message });
    }

    // Log
    await logAction({
      action: "BUILD_TREE",
      ip: req.ip,
      metadata: {
        root: result.root,
        totalUsers: result.totalUsers,
        totalAmount: result.totalAmount,
        category: result.category,
      },
    });

    res.json({
      success: true,
      data: {
        root: result.root,
        totalUsers: result.totalUsers,
        totalAmount: result.totalAmount,
        category: result.category,
      },
    });

  } catch (err: any) {
    console.error("Build Merkle error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/merkle/proof/:wallet
 * Get Merkle proof for a wallet
 */
export const getProof = async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const normalizedWallet = wallet.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { wallet: normalizedWallet },
      select: {
        wallet: true,
        amount: true,
        merkleProof: true,
        merkleLeaf: true,
        isEligible: true,
        isBlocked: true,
      },
    });

    if (!user || !user.isEligible || user.isBlocked) {
      return res.status(404).json({
        success: false,
        error: "User not eligible or not found",
      });
    }

    if (!user.merkleProof || user.merkleProof.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Merkle proof not generated yet. Contact admin.",
      });
    }

    // Get active snapshot for root
    const snapshot = await getActiveSnapshot();

    res.json({
      success: true,
      data: {
        wallet: user.wallet,
        amount: user.amount,
        leaf: user.merkleLeaf,
        proof: user.merkleProof,
        root: snapshot?.root,
        chainId: CHAIN_ID,
      },
    });

  } catch (err: any) {
    console.error("Get proof error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/merkle/snapshot
 * Get active snapshot
 */
export const getSnapshot = async (req: Request, res: Response) => {
  try {
    const snapshot = await getActiveSnapshot();

    if (!snapshot) {
      return res.status(404).json({ success: false, error: "No active snapshot found" });
    }

    res.json({
      success: true,
      data: {
        id: snapshot.id,
        root: snapshot.root,
        totalUsers: snapshot.totalUsers,
        totalAmount: snapshot.totalAmount,
        category: snapshot.category,
        createdAt: snapshot.createdAt,
      },
    });

  } catch (err: any) {
    console.error("Get snapshot error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/merkle/snapshots
 * Get snapshot history
 */
export const getSnapshots = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const snapshots = await getSnapshotHistory(limit);

    res.json({
      success: true,
      data: snapshots.map((s) => ({
        id: s.id,
        root: s.root,
        totalUsers: s.totalUsers,
        totalAmount: s.totalAmount,
        category: s.category,
        isActive: s.isActive,
        createdAt: s.createdAt,
      })),
    });

  } catch (err: any) {
    console.error("Get snapshots error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/merkle/verify
 * Verify a Merkle proof
 */
export const verifyProof = async (req: Request, res: Response) => {
  try {
    const { wallet, amount, proof, root } = req.body;

    if (!wallet || !amount || !proof || !root) {
      return res.status(400).json({ success: false, error: "Missing parameters" });
    }

    const { verifyProof: verify } = require("../merkle/tree.service");
    const { hashLeaf } = require("../merkle/hash.service");

    const leaf = hashLeaf(wallet, amount, CHAIN_ID);
    const isValid = verify(root, leaf, proof);

    res.json({
      success: true,
      data: {
        wallet,
        amount,
        leaf,
        root,
        isValid,
      },
    });

  } catch (err: any) {
    console.error("Verify proof error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const merkleController = {
  buildMerkle,
  getProof,
  getSnapshot,
  getSnapshots,
  verifyProof,
};