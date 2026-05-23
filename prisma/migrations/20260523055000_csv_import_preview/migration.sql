-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('pending', 'imported', 'cancelled');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('ready', 'invalid', 'duplicate', 'imported', 'skipped');

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'pending',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "readyRows" INTEGER NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "status" "ImportRowStatus" NOT NULL,
    "reason" TEXT,
    "type" "TransactionType",
    "amount" DECIMAL(12,2),
    "date" TIMESTAMP(3),
    "description" TEXT,
    "categoryId" TEXT,
    "paymentMethodId" TEXT,
    "externalId" TEXT,
    "matchedRuleId" TEXT,
    "raw" JSONB,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportBatch_householdId_createdAt_idx" ON "ImportBatch"("householdId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportRow_batchId_status_idx" ON "ImportRow"("batchId", "status");

-- CreateIndex
CREATE INDEX "ImportRow_externalId_idx" ON "ImportRow"("externalId");

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
