import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Routes
import airdropRoutes from "./routes/airdrop.routes";
import claimRoutes from "./routes/claim.routes";
import merkleRoutes from "./routes/merkle.routes";
import reportsRoutes from "./routes/reports.routes";
import purchaseRoutes from "./routes/purchase.routes";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    chain: "sepolia",
    chainId: 11155111,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/airdrop", airdropRoutes);
app.use("/api/claim", claimRoutes);
app.use("/api/merkle", merkleRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/purchase", purchaseRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[ERROR]", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;