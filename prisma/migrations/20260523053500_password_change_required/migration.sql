-- AlterTable
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- Mark the two seeded accounts for mandatory password rotation.
UPDATE "User"
SET "mustChangePassword" = true
WHERE "login" IN ('kacper', 'narzeczona');
