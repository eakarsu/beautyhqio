-- Tenant-scope daily closeout reports (TOP20 finding: /api/daily-closeout was
-- cross-tenant because DailyCloseout had no business association).
-- Existing staff-specific rows are attributed through their staff member's
-- business; legacy "all staff" rows cannot be attributed and remain NULL so
-- they are not exposed to any tenant by the new businessId filter.
ALTER TABLE "DailyCloseout" ADD COLUMN "businessId" TEXT;

UPDATE "DailyCloseout" d
SET "businessId" = u."businessId"
FROM "Staff" s
JOIN "User" u ON u."id" = s."userId"
WHERE d."staffId" = s."id";

CREATE INDEX "DailyCloseout_businessId_date_idx" ON "DailyCloseout"("businessId", "date");
