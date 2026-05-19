/*
  Warnings:

  - Added the required column `tokenAmountWei` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "tokenAmountWei" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "airdropAllocatedWei" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "chainId" INTEGER NOT NULL DEFAULT 11155111;

-- CreateTable
CREATE TABLE "AirdropClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amountWei" TEXT NOT NULL,
    "amountFor" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AirdropClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VestingClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amountWei" TEXT NOT NULL,
    "amountFor" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VestingClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AirdropClaim_txHash_key" ON "AirdropClaim"("txHash");

-- CreateIndex
CREATE INDEX "AirdropClaim_userId_idx" ON "AirdropClaim"("userId");

-- CreateIndex
CREATE INDEX "AirdropClaim_txHash_idx" ON "AirdropClaim"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "VestingClaim_txHash_key" ON "VestingClaim"("txHash");

-- CreateIndex
CREATE INDEX "VestingClaim_userId_idx" ON "VestingClaim"("userId");

-- CreateIndex
CREATE INDEX "VestingClaim_txHash_idx" ON "VestingClaim"("txHash");

-- CreateIndex
CREATE INDEX "User_wallet_chainId_idx" ON "User"("wallet", "chainId");

-- AddForeignKey
ALTER TABLE "AirdropClaim" ADD CONSTRAINT "AirdropClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("wallet") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VestingClaim" ADD CONSTRAINT "VestingClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("wallet") ON DELETE CASCADE ON UPDATE CASCADE;
