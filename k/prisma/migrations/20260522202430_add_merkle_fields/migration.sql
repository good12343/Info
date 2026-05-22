-- CreateEnum
CREATE TYPE "MerkleJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AirdropSyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'FAILED');

-- CreateTable
CREATE TABLE "AirdropState" (
    "id" TEXT NOT NULL,
    "merkleRoot" TEXT NOT NULL DEFAULT '0x0',
    "totalEligible" INTEGER NOT NULL DEFAULT 0,
    "totalAmountWei" TEXT NOT NULL DEFAULT '0',
    "lastSyncedAt" TIMESTAMP(3),
    "syncTxHash" TEXT,
    "status" "AirdropSyncStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirdropState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerkleJob" (
    "id" TEXT NOT NULL,
    "status" "MerkleJobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "root" TEXT,
    "txHash" TEXT,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmountWei" TEXT NOT NULL DEFAULT '0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerkleJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "User_airdropPoints_idx" ON "User"("airdropPoints");

-- CreateIndex
CREATE INDEX "UserTask_status_idx" ON "UserTask"("status");
