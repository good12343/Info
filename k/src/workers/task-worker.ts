// src/workers/task-worker.ts
import * as riskEngine from "../services/risk-engine.service";
import * as verificationBot from "../services/task-verification.bot";
import * as rewardEngine from "../services/reward.service";
import * as fraudDetector from "../services/fraud-detector.service";
import { prisma } from "../db/prisma";
import { UserTaskStatus } from "@prisma/client";

/**
 * ⚙️ Task Worker
 */
export const processTaskExecution = async (
  userId: string,
  taskId: string,
  ip: string,
  userAgent?: string,
  proof?: any
) => {
  // 1. جلب المستخدم والمهمة
  const userRecord = await prisma.user.findUnique({ where: { id: userId } });
  const taskRecord = await prisma.task.findUnique({ where: { id: taskId } });

  if (!userRecord || !taskRecord) {
    throw new Error("User or Task not found");
  }

  // 2. التحقق من عدم التكرار
  const existingTask = await prisma.userTask.findUnique({
    where: { userId_taskId: { userId, taskId } }
  });

  if (existingTask?.rewardGiven) {
    return { status: "ALREADY_CLAIMED", riskScore: 0 };
  }

  // 3. Risk Analysis
  const riskResult = await riskEngine.analyzeRisk(userId, ip, userAgent);

  await prisma.riskLog.create({
    data: {
      userId,
      taskId,
      score: riskResult.score,
      reason: riskResult.reasons.join(", "),
      ip,
      userAgent,
      action: riskResult.action
    }
  });

  if (riskResult.action === "REJECT") {
    throw new Error("Task rejected by Risk Engine");
  }

  // 4. Verification (التحقق الحقيقي - يُرجع false مؤقتاً)
  const isVerified = await verificationBot.verifyTaskExecution(taskRecord, proof);

  // 5. تحديد الحالة النهائية
  let finalStatus: UserTaskStatus;
  
  if (riskResult.action === "REVIEW") {
    finalStatus = UserTaskStatus.REVIEW;
  } else if (isVerified) {
    finalStatus = UserTaskStatus.VERIFIED;
  } else {
    // التحقق فشل - نضع في REVIEW للمراجعة اليدوية
    finalStatus = UserTaskStatus.REVIEW;
  }

  // 6. حفظ/تحديث المهمة
  const userTask = await prisma.userTask.upsert({
    where: { userId_taskId: { userId, taskId } },
    update: {
      status: finalStatus,
      ip,
      userAgent,
      metadata: proof ?? {},
      completedAt: new Date()
    },
    create: {
      userId,
      taskId,
      status: finalStatus,
      ip,
      userAgent,
      metadata: proof ?? {},
      rewardGiven: false,
      completedAt: new Date()
    }
  });

  // 7. توزيع المكافأة (فقط إذا VERIFIED)
  if (finalStatus === UserTaskStatus.VERIFIED && !userTask.rewardGiven) {
    await rewardEngine.distributeReward(userId, taskId);
    
    await prisma.userTask.update({
      where: { id: userTask.id },
      data: { rewardGiven: true }
    });
  }

  // 8. تحليل الاحتيال
  await fraudDetector.analyzeFraudPatterns(userId);

  return {
    status: finalStatus,
    riskScore: riskResult.score,
    verified: isVerified
  };
};
