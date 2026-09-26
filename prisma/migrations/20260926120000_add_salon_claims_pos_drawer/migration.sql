-- Salon reimbursement + POS register.
--
-- These tables back the salon-ops endpoints (insurance/HSA eligibility and
-- claims, till transactions, drawer close-out). They were previously applied
-- with `prisma db push`, which leaves no migration record — so any fresh
-- environment (staging, production) would have failed every salon-ops call.
-- This migration makes the schema reproducible via `prisma migrate deploy`.

-- CreateTable
CREATE TABLE "SalonClaim" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "appointmentId" TEXT,
    "planType" TEXT NOT NULL,
    "serviceCode" TEXT,
    "serviceName" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "eligibilityStatus" TEXT NOT NULL DEFAULT 'unknown',
    "eligibilityReason" TEXT,
    "claimStatus" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "reimbursedAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalonClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonPosTransaction" (
    "id" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "barcode" TEXT,
    "itemName" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "tenderType" TEXT NOT NULL DEFAULT 'cash',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalonPosTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonDrawerEvent" (
    "id" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "expectedAmount" DECIMAL(12,2) NOT NULL,
    "countedAmount" DECIMAL(12,2) NOT NULL,
    "variance" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalonDrawerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalonPosTransaction_registerId_createdAt_idx" ON "SalonPosTransaction"("registerId", "createdAt");

-- CreateIndex
CREATE INDEX "SalonDrawerEvent_registerId_recordedAt_idx" ON "SalonDrawerEvent"("registerId", "recordedAt");
