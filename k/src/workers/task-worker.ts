import * as riskEngine from "../services/risk-engine.service";
import * as verificationBot from "../services/task-verification.bot";
import * as rewardEngine from "../services/reward.service";
import * as fraudDetector from "../services/fraud-detector.service";
import { prisma } from "../db/prisma";

/**
 * ⚙️ Task Worker (SAFE VERSION)
 */
export const processTaskExecution = async (
  userId: string,
  taskId: string,
  ip: string,
  userAgent?: string,
  proof?: any
) => {

  // 1. جلب المستخدم والمهمة
  const userRecord = await prisma.user.findUnique({
    where: { id: userId }
  });

  const taskRecord = await prisma.task.findUnique({
    where: { id: taskId }
  });

  if (!userRecord || !taskRecord) {
    throw new Error("User or Task not found");
  }

  // 2. جلب سجل المهمة (مهم جدًا لمنع التكرار)
  const existingTask = await prisma.userTask.findUnique({
    where: {
      userId_taskId: {
        userId,
        taskId
      }
    }
  });

  // 🚨 3. منع إعادة المكافأة (CORE FIX)
  if (existingTask?.rewardGiven) {
    return {
      status: "ALREADY_CLAIMED",
      riskScore: 0
    };
  }

  // 4. Risk Analysis
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

  // 5. Verification
  const isVerified = await verificationBot.verifyTaskExecution(taskRecord, proof);

  const finalStatus =
    riskResult.action === "REVIEW"
      ? "REVIEW"
      : isVerified
        ? "VERIFIED"
        : "PENDING";

  // 6. حفظ/تحديث المهمة
  const userTask = await prisma.userTask.upsert({
    where: {
      userId_taskId: {
        userId,
        taskId
      }
    },
    update: {
      status: finalStatus,
      ip,
      userAgent,
      metadata: proof
    },
    create: {
      userId,
      taskId,
      status: finalStatus,
      ip,
      userAgent,
      metadata: proof,
      rewardGiven: false
    }
  });

  // 7. توزيع المكافأة (مع حماية قوية)
  if (finalStatus === "VERIFIED" && !userTask.rewardGiven) {
    await rewardEngine.distributeReward(userId, taskId);

    await prisma.userTask.update({
      where: {
        userId_taskId: {
          userId,
          taskId
        }
      },
      data: {
        rewardGiven: true
      }
    });
  }

  // 8. تحليل الاحتيال
  await fraudDetector.analyzeFraudPatterns(userId);

  return {
    status: finalStatus,
    riskScore: riskResult.score
  };
};