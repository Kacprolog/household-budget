-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('manual', 'csv', 'bank', 'recurring');

-- CreateEnum
CREATE TYPE "BankProvider" AS ENUM ('kontomatik', 'fizen', 'enable_banking', 'neonomics', 'salt_edge', 'gocardless', 'csv_only');

-- CreateEnum
CREATE TYPE "BankConnectionStatus" AS ENUM ('draft', 'connected', 'expired', 'error', 'disabled');

-- AlterTable
ALTER TABLE "Transaction"
ADD COLUMN "source" "TransactionSource" NOT NULL DEFAULT 'manual',
ADD COLUMN "externalId" TEXT;

-- CreateTable
CREATE TABLE "BankConnection" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "provider" "BankProvider" NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "BankConnectionStatus" NOT NULL DEFAULT 'draft',
    "consentId" TEXT,
    "encryptedToken" TEXT,
    "tokenLastFour" TEXT,
    "consentExpiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "bankConnectionId" TEXT NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ibanMasked" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "balance" DECIMAL(12,2),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "counterparty" TEXT,
    "description" TEXT,
    "raw" JSONB,
    "importedAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_householdId_source_externalId_key" ON "Transaction"("householdId", "source", "externalId");

-- CreateIndex
CREATE INDEX "BankConnection_householdId_provider_status_idx" ON "BankConnection"("householdId", "provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_bankConnectionId_externalAccountId_key" ON "BankAccount"("bankConnectionId", "externalAccountId");

-- CreateIndex
CREATE INDEX "BankAccount_householdId_idx" ON "BankAccount"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_transactionId_key" ON "BankTransaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_bankAccountId_externalId_key" ON "BankTransaction"("bankAccountId", "externalId");

-- CreateIndex
CREATE INDEX "BankTransaction_householdId_bookedAt_idx" ON "BankTransaction"("householdId", "bookedAt");

-- AddForeignKey
ALTER TABLE "BankConnection" ADD CONSTRAINT "BankConnection_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_bankConnectionId_fkey" FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
