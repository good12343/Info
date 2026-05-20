import express from "express";
import cors from "cors";
import airdropRoutes from "./routes/airdrop.routes";
import purchaseRoutes from "./routes/purchase.routes";
import vestingRoutes from "./routes/vesting.routes";
import tasksRoutes from "./routes/task.routes";
import adminRoutes from "./routes/admin.routes"; // ← جديد

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/airdrop", airdropRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/vesting", vestingRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/admin", adminRoutes); // ← جديد

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

export default app;
