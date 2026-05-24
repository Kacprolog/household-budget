CREATE INDEX "tx_household_deleted_type_date_idx"
  ON "Transaction"("householdId", "deletedAt", "type", "date");

CREATE INDEX "tx_household_deleted_category_date_idx"
  ON "Transaction"("householdId", "deletedAt", "categoryId", "date");

CREATE INDEX "tx_household_deleted_author_date_idx"
  ON "Transaction"("householdId", "deletedAt", "addedById", "date");

CREATE INDEX "tx_household_deleted_method_date_idx"
  ON "Transaction"("householdId", "deletedAt", "paymentMethodId", "date");

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "tx_description_trgm_idx"
  ON "Transaction" USING GIN ("description" gin_trgm_ops)
  WHERE "description" IS NOT NULL AND "deletedAt" IS NULL;
