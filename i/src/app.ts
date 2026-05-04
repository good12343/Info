import express from "express";
import airdropRoutes from "./routes/airdrop.routes";

const app = express();

app.use("/claim", limiter);

app.use(express.json());

app.use("/airdrop", airdropRoutes);


export default app;