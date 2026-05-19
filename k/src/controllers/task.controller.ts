import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { processTaskExecution } from "../workers/task-worker";

/**
 * GET /api/tasks/list
 */
export const listTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({ where: { isActive: true } });
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/tasks/complete
 */
export const completeTask = async (req: Request, res: Response) => {
  try {
    const { wallet, taskId, proof } = req.body;
    const ip = req.ip || "0.0.0.0";
    const userAgent = req.get("User-Agent");

    // 1. جلب المستخدم بواسطة المحفظة (لأن المحفظة هي المدخل من الـ Frontend)
    const user = await prisma.user.findUnique({ where: { wallet: wallet.toLowerCase() } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isBlocked) return res.status(403).json({ error: "User is blocked" });

    // 2. إرسال المهمة للمعالجة عبر الـ Worker (الذي يربط كافة المحركات)
    const result = await processTaskExecution(user.id, taskId, ip, userAgent, proof);
    
    res.json({
      success: true,
      status: result.status,
      riskScore: result.riskScore
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/tasks/status
 */
export const getStatus = async (req: Request, res: Response) => {
  try {
    const { wallet } = req.query;
    const user = await prisma.user.findUnique({ 
      where: { wallet: (wallet as string).toLowerCase() },
      include: { userTasks: true }
    });
    
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.userTasks);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const tasksController = {
  listTasks,
  completeTask,
  getStatus,
};
