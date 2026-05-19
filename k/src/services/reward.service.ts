import { prisma } from "../db/prisma";
import { processAirdrop } from "./airdrop.service";

/**
 * 💰 Reward Engine
 * المسؤول الوحيد عن توزيع النقاط وتحديث الأيردروب
 */
export const distributeReward = async (userId: string, taskId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. التحقق المزدوج من DB (Double-check)
    const userTask = await tx.userTask.findUnique({
      where: { userId_taskId: { userId, taskId } },
      include: { task: true, user: true }
    });

    if (!userTask || userTask.status !== "VERIFIED" || userTask.rewardGiven) {
      throw new Error("Reward already given or task not verified");
    }

    // 2. تحديث حالة المكافأة أولاً (Prevent race conditions)
    await tx.userTask.update({
      where: { id: userTask.id },
      data: { rewardGiven: true }
    });

    // 3. إضافة النقاط للمستخدم
    const newPoints = userTask.user.airdropPoints + userTask.task.points;
    
    // 4. استدعاء نظام الأيردروب (Merkle Tree Update)
    // ملاحظة: نمرر tx لضمان الذرية (Atomicity) إذا كانت الخدمة تدعم ذلك، 
    // أو نعتمد على أن processAirdrop تقوم بتحديث الـ DB.
    await processAirdrop(userTask.user.wallet, newPoints);

    return { success: true, points: userTask.task.points };
  });
};
