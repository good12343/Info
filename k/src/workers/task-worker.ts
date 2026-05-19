import * as riskEngine from "../services/risk-engine.service";
import * as verificationBot from "../services/task-verification.bot";
import * as rewardEngine from "../services/reward.service";
import * as fraudDetector from "../services/fraud-detector.service";
import { prisma } from "../db/prisma";

/**
 * ⚙️ Task Worker
 */
export const processTaskExecution = async (userId: string, taskId: string, ip: string, userAgent?: string, proof?: any) => {
  const userRecord = await prisma.user.findUnique({ where: { id: userId } });
  const taskRecord = await prisma.task.findUnique({ where: { id: taskId } });

  if (!userRecord || !taskRecord) throw new Error("User or Task not found");

  // 1. Risk Analysis
  const riskResult = await riskEngine.analyzeRisk(userId, ip, userAgent);
  
  // تسجيل في RiskLog
  await prisma.riskLog.create({
    data: {
      userId: userId,
      taskId: taskId,
      score: riskResult.score,
      reason: riskResult.reasons.join(", "),
      ip: ip,
      userAgent: userAgent,
      action: riskResult.action
    }
  });

  if (riskResult.action === "REJECT") {
    throw new Error("Task rejected by Risk Engine");
  }

  // 2. Automated Verification
  const isVerified = await verificationBot.verifyTaskExecution(taskRecord, proof);
  
  // 3. Update UserTask Status
  const finalStatus = riskResult.action === "REVIEW" ? "REVIEW" : (isVerified ? "VERIFIED" : "PENDING");
  
  await prisma.userTask.upsert({
    where: { 
      userId_taskId: { 
        userId: userId, 
        taskId: taskId 
      } 
    },
    update: { 
      status: finalStatus, 
      ip: ip, 
      userAgent: userAgent, 
      metadata: proof 
    },
    create: { 
      userId: userId, 
      taskId: taskId, 
      status: finalStatus, 
      ip: ip, 
      userAgent: userAgent, 
      metadata: proof 
    }
  });

  // 4. Distribute Reward if Verified
  if (finalStatus === "VERIFIED") {
    await rewardEngine.distributeReward(userId, taskId);
  }

  // 5. Post-process Fraud Analysis
  await fraudDetector.analyzeFraudPatterns(userId);

  return { status: finalStatus, riskScore: riskResult.score };
};
