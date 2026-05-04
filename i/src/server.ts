import express from "express";
import "dotenv/config";
import claimRoute from "./routes/claim.routes";

const app = express();

app.use(express.json());

// 👇 هنا ربط الـ route
app.use("/claim", claimRoute);

app.listen(3000, () => {
  console.log("Brain running on port 3000...");
});