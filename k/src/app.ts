import express from "express";
import cors from "cors";
import airdropRoutes from "./routes/airdrop.routes";
import purchaseRoutes from "./routes/purchase.routes";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/airdrop", airdropRoutes);
app.use("/api/purchase", purchaseRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

export default app;
