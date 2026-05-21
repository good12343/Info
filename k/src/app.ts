import express from "express";
import cors from "cors";
import { ethers } from "ethers";

import airdropRoutes from "./routes/airdrop.routes";
import purchaseRoutes from "./routes/purchase.routes";
import vestingRoutes from "./routes/vesting.routes";
import tasksRoutes from "./routes/task.routes";
import adminRoutes from "./routes/admin.routes";

import { airdropContractRead } from "./blockchain/airdrop.contract";

const app = express();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// Auth: Check wallet roles on Airdrop contract
// GET /api/auth/check-role?wallet=0x...
// ─────────────────────────────────────────────────────────────
const GOVERNANCE_ROLE = ethers.keccak256(
  ethers.toUtf8Bytes("GOVERNANCE_ROLE")
);

app.get("/api/auth/check-role", async (req, res) => {
  try {
    const wallet = req.query.wallet as string;

    if (!wallet) {
      return res.status(400).json({
        error: "wallet is required"
      });
    }

    const isGov = await airdropContractRead.hasRole(
      GOVERNANCE_ROLE,
      wallet
    );

    const isAdmin = await airdropContractRead.hasRole(
      ethers.ZeroHash,
      wallet
    );

    res.json({
      wallet,
      isGov,
      isAdmin
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────
app.use("/api/airdrop", airdropRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/vesting", vestingRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/admin", adminRoutes);

// Health Check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date()
  });
});

// Optional test route
app.get("/ping", (_req, res) => {
  res.send("pong");
});

export default app;