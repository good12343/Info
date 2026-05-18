-- CreateEnum
CREATE TYPE "UserCategory" AS ENUM ('AIRDROP_ONLY', 'BUYER_ONLY', 'AIRDROP_BUYER', 'NONE');

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateTable
CREATE TABLE "User" (
    "wallet" TEXT NOT NULL,
    "category" "UserCategory" NOT NULL DEFAULT 'NONE',
    "tier" "UserTier" NOT NULL DEFAULT 'BRONZE',
    "airdropPoints" INTEGER NOT NULL DEFAULT 0,
    "airdropAllocated" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "hasClaimedAirdrop" BOOLEAN NOT NULL DEFAULT false,
    "airdropClaimedAt" TIMESTAMP(3),
    "airdropTxHash" TEXT,
    "totalBoughtUsd" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "hasClaimedTokens" BOOLEAN NOT NULL DEFAULT false,
    "tokensClaimedAt" TIMESTAMP(3),
    "tokensClaimTxHash" TEXT,
    "merkleProof" TEXT[],
    "merkleLeaf" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amountUsd" DECIMAL(65,30) NOT NULL,
    "tokenAmount" DECIMAL(65,30) NOT NULL,
    "tokenPrice" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "txHash" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalUsers" INTEGER NOT NULL,
    "totalAirdrop" DECIMAL(65,30) NOT NULL,
    "totalPurchased" DECIMAL(65,30) NOT NULL,
    "claimedAirdrop" INTEGER NOT NULL,
    "claimedTokens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_category_idx" ON "User"("category");

-- CreateIndex
CREATE INDEX "User_hasClaimedAirdrop_idx" ON "User"("hasClaimedAirdrop");

-- CreateIndex
CREATE INDEX "User_hasClaimedTokens_idx" ON "User"("hasClaimedTokens");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_txHash_key" ON "Purchase"("txHash");

-- CreateIndex
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_key" ON "DailyStats"("date");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("wallet") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("wallet") ON DELETE SET NULL ON UPDATE CASCADE;
