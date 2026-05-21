import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { TaskPlatform, TaskCategory, UserTaskStatus } from "@prisma/client";

// ─────────────────────────────────────────────
// Audit Log Helper
// ─────────────────────────────────────────────
const auditAction = async (
  action: string,
  userId: string,
  metadata?: any
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action: `ADMIN_${action}`,
        userId,
        metadata: metadata || {},
        ip: "admin-panel",
      },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
};

// ─────────────────────────────────────────────
// Safe helpers (fix string | string[] issue)
// ─────────────────────────────────────────────
const safeString = (v: any): string | undefined => {
  if (!v) return undefined;
  if (Array.isArray(v)) return v[0];
  return String(v);
};

const safeNumber = (v: any): number | undefined => {
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) v = v[0];
  const n = Number(v);
  return isNaN(n) ? undefined : n;
};

// ─────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────
export const listAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet;
    if (!adminWallet) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id, title, description, points, platform, category, url } =
      req.body;

    const task = await prisma.task.create({
      data: {
        id,
        title,
        description: description || null,
        points: Number(points),
        platform: platform as TaskPlatform,
        category: category as TaskCategory,
        url: url || null,
        isActive: true,
      },
    });

    await auditAction("TASK_CREATE", adminWallet, {
      taskId: id,
      title,
    });

    res.json({ success: true, task });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet!;
    const id = safeString(req.params.id);

    if (!id) return res.status(400).json({ error: "Invalid id" });

    const { title, description, points, platform, category, url, isActive } =
      req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        points: safeNumber(points),
        platform: platform as TaskPlatform,
        category: category as TaskCategory,
        url,
        isActive,
      },
    });

    await auditAction("TASK_UPDATE", adminWallet, {
      taskId: id,
    });

    res.json({ success: true, task });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet!;
    const id = safeString(req.params.id);

    if (!id) return res.status(400).json({ error: "Invalid id" });

    const count = await prisma.userTask.count({
      where: { taskId: id },
    });

    if (count > 0) {
      return res.status(400).json({
        error: "Cannot delete task with existing completions",
      });
    }

    await prisma.task.delete({
      where: { id },
    });

    await auditAction("TASK_DELETE", adminWallet, { taskId: id });

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const toggleTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet!;
    const id = safeString(req.params.id);

    if (!id) return res.status(400).json({ error: "Invalid id" });

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const updated = await prisma.task.update({
      where: { id },
      data: { isActive: !task.isActive },
    });

    await auditAction("TASK_TOGGLE", adminWallet, {
      taskId: id,
      isActive: updated.isActive,
    });

    res.json({ success: true, task: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// USER TASKS
// ─────────────────────────────────────────────
export const listUserTasks = async (req: Request, res: Response) => {
  try {
    const status = safeString(req.query.status);
    const wallet = safeString(req.query.wallet);
    const taskId = safeString(req.query.taskId);

    const where: any = {};

    if (status) where.status = status;
    if (taskId) where.taskId = taskId;

    if (wallet) {
      const user = await prisma.user.findUnique({
        where: { wallet },
      });

      if (user) where.userId = user.id;
    }

    const userTasks = await prisma.userTask.findMany({
      where,
      include: {
        user: { select: { wallet: true, id: true } },
        task: { select: { title: true, platform: true, points: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 100,
    });

    res.json(userTasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// USER TASK VERIFY / REJECT (MISSING FIX)
// ─────────────────────────────────────────────

const verifyUserTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet!;
    const id = safeString(req.params.id);

    if (!id) return res.status(400).json({ error: "Invalid id" });

    const userTask = await prisma.userTask.update({
      where: { id },
      data: {
        status: UserTaskStatus.VERIFIED,
        rewardGiven: true,
      },
    });

    await auditAction("USER_TASK_VERIFY", adminWallet, {
      userTaskId: id,
    });

    res.json({ success: true, userTask });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const rejectUserTask = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet!;
    const id = safeString(req.params.id);

    if (!id) return res.status(400).json({ error: "Invalid id" });

    const userTask = await prisma.userTask.update({
      where: { id },
      data: {
        status: UserTaskStatus.REJECTED,
      },
    });

    await auditAction("USER_TASK_REJECT", adminWallet, {
      userTaskId: id,
    });

    res.json({ success: true, userTask });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// REVIEW QUEUE
// ─────────────────────────────────────────────
export const getReviewQueue = async (req: Request, res: Response) => {
  try {
    const queue = await prisma.userTask.findMany({
      where: { status: UserTaskStatus.REVIEW },
      include: {
        user: { select: { wallet: true, riskScore: true } },
        task: { select: { title: true, platform: true, points: true } },
      },
      orderBy: { completedAt: "desc" },
    });

    res.json(queue);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const approveReview = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet!;
    const id = safeString(req.params.id);

    if (!id) return res.status(400).json({ error: "Invalid id" });

    const userTask = await prisma.userTask.update({
      where: { id },
      data: { status: UserTaskStatus.VERIFIED },
    });

    await auditAction("REVIEW_APPROVE", adminWallet, {
      userTaskId: id,
    });

    res.json({ success: true, userTask });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const rejectReview = async (req: Request, res: Response) => {
  try {
    const adminWallet = req.wallet!;
    const id = safeString(req.params.id);

    if (!id) return res.status(400).json({ error: "Invalid id" });

    const userTask = await prisma.userTask.update({
      where: { id },
      data: { status: UserTaskStatus.REJECTED },
    });

    await auditAction("REVIEW_REJECT", adminWallet, {
      userTaskId: id,
    });

    res.json({ success: true, userTask });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalTasks,
      activeTasks,
      totalUserTasks,
      verifiedTasks,
      pendingReviews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.count({ where: { isActive: true } }),
      prisma.userTask.count(),
      prisma.userTask.count({ where: { status: UserTaskStatus.VERIFIED } }),
      prisma.userTask.count({ where: { status: UserTaskStatus.REVIEW } }),
    ]);

    res.json({
      totalUsers,
      totalTasks,
      activeTasks,
      totalUserTasks,
      verifiedTasks,
      pendingReviews,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
export const adminController = {
  listAllTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  listUserTasks,
  getReviewQueue,
  approveReview,
  rejectReview,
  getDashboardStats,
  verifyUserTask,
  rejectUserTask,
};