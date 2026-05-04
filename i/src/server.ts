import "dotenv/config";
import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const app = express();

// ✅ إنشاء connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ إنشاء adapter
const adapter = new PrismaPg(pool);

// ✅ إنشاء PrismaClient مع adapter
const prisma = new PrismaClient({ adapter });

app.use(express.json());

app.post("/airdrop", async (req: Request, res: Response) => {
  const { wallet, points } = req.body;
  const tokens = Math.floor(points / 10);

  const user = await prisma.user.upsert({
    where: { wallet },
    update: {
      airdropPoints: { increment: points },
      tokensAllocated: { increment: tokens },
    },
    create: {
      wallet,
      airdropPoints: points,
      tokensAllocated: tokens,
    },
  });

  res.json(user);
});

app.listen(3000, () => {
  console.log("Brain running on port 3000...");
});
