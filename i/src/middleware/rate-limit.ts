// src/middleware/rate-limit.ts
import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 request per minute
});