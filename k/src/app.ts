import express from "express";
import cors from "cors";
import airdropRoutes from "./routes/airdrop.routes";
import purchaseRoutes from "./routes/purchase.routes";
import vestingRoutes from "./routes/vesting.routes";
import tasksRoutes from "./routes/task.routes";
import adminRoutes from "./routes/admin.routes"; // ← جديد
import authRoutes from "./routes/auth.routes";
import './types/global';
import { initCronJobs } from "./workers/cron-scheduler";
import { cronRebuild } from "./workers/merkle-worker";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/airdrop", airdropRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/vesting", vestingRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/admin", adminRoutes); // ← جديد
app.use("/api/auth", authRoutes);

initCronJobs();

cronRebuild();

// Health Check
app.get("/health", (req, res) => {
res.json({ status: "ok", timestamp: new Date() });
});

export default app;