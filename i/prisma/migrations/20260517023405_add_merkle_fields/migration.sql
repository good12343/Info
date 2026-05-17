-- CreateEnum
CREATE TYPE "UserCategory" AS ENUM ('AIRDROP_ONLY', 'AIRDROP_BUYER', 'BUYER_ONLY', 'NONE');

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateTable
CREATE TABLE "User" (
    "wallet" TEXT NOT NULL,
    "totalBought" INTEGER NOT NULL DEFAULT 0,
    "airdropPoints" INTEGER NOT NULL DEFAULT 0,
    "tokensAllocated" TEXT NOT NULL DEFAULT '0',
    "tokensBought" TEXT NOT NULL DEFAULT '0',
    "vestedTokens" TEXT NOT NULL DEFAULT '0',
    "claimableTokens" TEXT NOT NULL DEFAULT '0',
    "category" "UserCategory" NOT NULL DEFAULT 'NONE',
    "tier" "UserTier" NOT NULL DEFAULT 'BRONZE',
    "isEligible" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isWhitelisted" BOOLEAN NOT NULL DEFAULT false,
    "hasClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "claimTxHash" TEXT,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpentUsd" TEXT NOT NULL DEFAULT '0',
    "firstPurchaseAt" TIMESTAMP(3),
    "lastPurchaseAt" TIMESTAMP(3),
    "merkleProof" TEXT[],
    "merkleLeaf" TEXT NOT NULL,
    "amount" TEXT NOT NULL DEFAULT '0',
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "deviceFingerprint" TEXT,
    "sources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amountUsd" TEXT NOT NULL,
    "tokenAmount" TEXT NOT NULL,
    "tokenPrice" TEXT NOT NULL,
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
    "ip" TEXT,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SybilCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT,
    "ipAddress" TEXT,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SybilCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerkleSnapshot" (
    "id" TEXT NOT NULL,
    "root" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "totalUsers" INTEGER NOT NULL,
    "totalAmount" TEXT NOT NULL,
    "category" "UserCategory" NOT NULL,
    "tier" "UserTier",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerkleSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryStats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "UserCategory" NOT NULL,
    "userCount" INTEGER NOT NULL,
    "totalTokens" TEXT NOT NULL,
    "avgTokens" TEXT NOT NULL,
    "claimedCount" INTEGER NOT NULL,
    "claimRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CategoryStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_category_idx" ON "User"("category");

-- CreateIndex
CREATE INDEX "User_tier_idx" ON "User"("tier");

-- CreateIndex
CREATE INDEX "User_isEligible_idx" ON "User"("isEligible");

-- CreateIndex
CREATE INDEX "User_hasClaimed_idx" ON "User"("hasClaimed");

-- CreateIndex
CREATE INDEX "User_isBlocked_idx" ON "User"("isBlocked");

-- CreateIndex
CREATE INDEX "User_chainId_idx" ON "User"("chainId");

-- CreateIndex
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");

-- CreateIndex
CREATE INDEX "Purchase_txHash_idx" ON "Purchase"("txHash");

-- CreateIndex
CREATE INDEX "Purchase_createdAt_idx" ON "Purchase"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_chainId_idx" ON "AuditLog"("chainId");

-- CreateIndex
CREATE INDEX "SybilCheck_userId_idx" ON "SybilCheck"("userId");

-- CreateIndex
CREATE INDEX "SybilCheck_fingerprint_idx" ON "SybilCheck"("fingerprint");

-- CreateIndex
CREATE INDEX "MerkleSnapshot_root_idx" ON "MerkleSnapshot"("root");

-- CreateIndex
CREATE INDEX "MerkleSnapshot_isActive_idx" ON "MerkleSnapshot"("isActive");

-- CreateIndex
CREATE INDEX "MerkleSnapshot_chainId_idx" ON "MerkleSnapshot"("chainId");

-- CreateIndex
CREATE INDEX "MerkleSnapshot_category_idx" ON "MerkleSnapshot"("category");

-- CreateIndex
CREATE INDEX "CategoryStats_date_idx" ON "CategoryStats"("date");

-- CreateIndex
CREATE INDEX "CategoryStats_category_idx" ON "CategoryStats"("category");
