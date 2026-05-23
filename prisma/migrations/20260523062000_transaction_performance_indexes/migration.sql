-- Frequent app views filter by household + soft-delete state and sort by date or creation time.
CREATE INDEX "Transaction_householdId_deletedAt_date_idx" ON "Transaction"("householdId", "deletedAt", "date");
CREATE INDEX "Transaction_householdId_deletedAt_createdAt_idx" ON "Transaction"("householdId", "deletedAt", "createdAt");
