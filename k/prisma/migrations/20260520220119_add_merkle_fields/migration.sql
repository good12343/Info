/*
  Warnings:

  - The `status` column on the `UserTask` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `action` on the `RiskLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `platform` on the `Task` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `Task` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TaskPlatform" AS ENUM ('X', 'TELEGRAM', 'YOUTUBE', 'ARTICLE');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('SOCIAL', 'VIDEO', 'ARTICLE');

-- CreateEnum
CREATE TYPE "UserTaskStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'REVIEW');

-- CreateEnum
CREATE TYPE "RiskAction" AS ENUM ('ALLOW', 'REVIEW', 'REJECT');

-- AlterTable
ALTER TABLE "RiskLog" DROP COLUMN "action",
ADD COLUMN     "action" "RiskAction" NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "platform",
ADD COLUMN     "platform" "TaskPlatform" NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "TaskCategory" NOT NULL;

-- AlterTable
ALTER TABLE "UserTask" DROP COLUMN "status",
ADD COLUMN     "status" "UserTaskStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "RiskLog_taskId_idx" ON "RiskLog"("taskId");

-- AddForeignKey
ALTER TABLE "RiskLog" ADD CONSTRAINT "RiskLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
