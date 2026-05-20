// src/controllers/admin.controller.ts
import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { TaskPlatform, TaskCategory, UserTaskStatus } from "@prisma/client";

// ✅ Helper: تسجيل كل action في AuditLog
const auditAction = async (action: string, userId: string, metadata?: any) => {
  await prisma.auditLog.create({
    data: {
      action: `ADMIN_${action}`,
      userId,
      metadata: metadata || {},
      ip: "admin-panel" // TODO: مرر IP الحقيقي
    }
  });
};

export const listAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet; // ← من middleware
    const { id, title, description, points, platform, category, url } = req.body;

    const task = await prisma.task.create({
      data: {
        id,
        title,
        description,
        points: parseInt(points),
        platform: platform as TaskPlatform,
        category: category as TaskCategory,
        url,
        isActive: true
      }
    });

    await auditAction("TASK_CREATE", adminWallet, { taskId: id, title });

    res.json({ success: true, task });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet;
    const { id } = req.params;
    const { title, description, points, platform, category, url, isActive } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        points: points ? parseInt(points) : undefined,
        platform: platform as TaskPlatform,
        category: category as TaskCategory,
        url,
        isActive
      }
    });

    await auditAction("TASK_UPDATE", adminWallet, { taskId: id, changes: req.body });

    res.json({ success: true, task });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet;
    const { id } = req.params;

    const userTasksCount = await prisma.userTask.count({ where: { taskId: id } });
    if (userTasksCount > 0) {
      return res.status(400).json({ 
        error: "Cannot delete task with existing completions. Deactivate instead." 
      });
    }

    await prisma.task.delete({ where: { id } });

    await auditAction("TASK_DELETE", adminWallet, { taskId: id });

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const toggleTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet;
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const updated = await prisma.task.update({
      where: { id },
      data: { isActive: !task.isActive }
    });

    await auditAction("TASK_TOGGLE", adminWallet, { 
      taskId: id, 
      isActive: updated.isActive 
    });

    res.json({ success: true, task: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const listUserTasks = async (req: Request, res: Response) => {
  try {
    const { status, wallet, taskId } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (taskId) where.taskId = taskId;
    if (wallet) {
      const user = await prisma.user.findUnique({ where: { wallet: wallet as string } });
      if (user) where.userId = user.id;
    }

    const userTasks = await prisma.userTask.findMany({
      where,
      include: {
        user: { select: { wallet: true, id: true } },
        task: { select: { title: true, platform: true, points: true } }
      },
      orderBy: { completedAt: "desc" },
      take: 100
    });

    res.json(userTasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyUserTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet;
    const { id } = req.params;

    const userTask = await prisma.userTask.update({
      where: { id },
      data: { 
        status: UserTaskStatus.VERIFIED,
        rewardGiven: true
      },
      include: { task: true, user: true }
    });

    // توزيع المكافأة
    const { distributeReward } = await import("../services/reward.service");
    await distributeReward(userTask.userId, userTask.taskId);

    await auditAction("USER_TASK_VERIFY", adminWallet, { 
      userTaskId: id,
      userId: userTask.userId,
      taskId: userTask.taskId,
      points: userTask.task.points
    });

    res.json({ success: true, userTask });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const rejectUserTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet;
    const { id } = req.params;

    const userTask = await prisma.userTask.update({
      where: { id },
      data: { status: UserTaskStatus.REJECTED }
    });

    await auditAction("USER_TASK_REJECT", adminWallet, { 
      userTaskId: id,
      userId: userTask.userId 
    });

    res.json({ success: true, userTask });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getReviewQueue = async (req: Request, res: Response) => {
  try {
    const queue = await prisma.userTask.findMany({
      where: { status: UserTaskStatus.REVIEW },
      include: {
        user: { select: { wallet: true, riskScore: true } },
        task: { select: { title: true, platform: true, points: true } }
      },
      orderBy: { completedAt: "desc" }
    });

    res.json(queue);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const approveReview = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet;
    const { id } = req.params;

    const userTask = await prisma.userTask.update({
      where: { id },
      data: { status: UserTaskStatus.VERIFIED }
    });

    const { distributeReward } = await import("../services/reward.service");
    await distributeReward(userTask.userId, userTask.taskId);

    await auditAction("REVIEW_APPROVE", adminWallet, { 
      userTaskId: id,
      userId: userTask.userId 
    });

    res.json({ success: true, userTask });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const rejectReview = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet;
    const { id } = req.params;

    const userTask = await prisma.userTask.update({
      where: { id },
      data: { status: UserTaskStatus.REJECTED }
    });

    await auditAction("REVIEW_REJECT", adminWallet, { 
      userTaskId: id,
      userId: userTask.userId 
    });

    res.json({ success: true, userTask });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalTasks,
      activeTasks,
      totalUserTasks,
      verifiedTasks,
      pendingReviews,
      totalPointsDistributed,
      totalAirdropClaims
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.count({ where: { isActive: true } }),
      prisma.userTask.count(),
      prisma.userTask.count({ where: { status: UserTaskStatus.VERIFIED } }),
      prisma.userTask.count({ where: { status: UserTaskStatus.REVIEW } }),
      prisma.user.aggregate({ _sum: { airdropPoints: true } }),
      prisma.airdropClaim.count()
    ]);

    res.json({
      totalUsers,
      totalTasks,
      activeTasks,
      totalUserTasks,
      verifiedTasks,
      pendingReviews,
      totalPointsDistributed: totalPointsDistributed._sum.airdropPoints || 0,
      totalAirdropClaims
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const adminController = {
  listAllTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  listUserTasks,
  verifyUserTask,
  rejectUserTask,
  getReviewQueue,
  approveReview,
  rejectReview,
  getDashboardStats
};
