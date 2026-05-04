"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
const app = (0, express_1.default)();
// ✅ إنشاء connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
// ✅ إنشاء adapter
const adapter = new adapter_pg_1.PrismaPg(pool);
// ✅ إنشاء PrismaClient مع adapter
const prisma = new client_1.PrismaClient({ adapter });
app.use(express_1.default.json());
app.post("/airdrop", async (req, res) => {
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
