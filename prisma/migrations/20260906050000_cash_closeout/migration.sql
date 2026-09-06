CREATE TABLE "CashDrawerSession" (
 "id" TEXT PRIMARY KEY, "businessId" TEXT NOT NULL REFERENCES "Business"("id"), "locationId" TEXT NOT NULL REFERENCES "Location"("id"),
 "openedById" TEXT NOT NULL REFERENCES "User"("id"), "openingCents" INTEGER NOT NULL CHECK ("openingCents">=0), "baselineAt" TIMESTAMP(3) NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'OPEN' CHECK ("status" IN ('OPEN','COUNTED','CLOSED')), "version" INTEGER NOT NULL DEFAULT 1,
 "countCents" INTEGER CHECK ("countCents">=0), "expectedCents" INTEGER, "varianceCents" INTEGER,
 "countedById" TEXT REFERENCES "User"("id"), "countedAt" TIMESTAMP(3), "approvedById" TEXT REFERENCES "User"("id"), "approvedAt" TIMESTAMP(3),
 "notes" TEXT NOT NULL, "reviewNotes" TEXT, "snapshot" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "CashDrawerSession_businessId_locationId_status_idx" ON "CashDrawerSession"("businessId","locationId","status");
CREATE UNIQUE INDEX "cash_drawer_one_active" ON "CashDrawerSession"("locationId") WHERE "status" <> 'CLOSED';
CREATE TABLE "CashDrawerMovement" (
 "id" TEXT PRIMARY KEY,"sessionId" TEXT NOT NULL REFERENCES "CashDrawerSession"("id"),"actorId" TEXT NOT NULL REFERENCES "User"("id"),
 "amountCents" INTEGER NOT NULL CHECK ("amountCents"<>0),"reason" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CashDrawerMovement_sessionId_createdAt_idx" ON "CashDrawerMovement"("sessionId","createdAt");
CREATE TABLE "CashDrawerAllocation" (
 "receiptKey" TEXT PRIMARY KEY,"sessionId" TEXT NOT NULL REFERENCES "CashDrawerSession"("id"),"amountCents" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CashDrawerAllocation_sessionId_idx" ON "CashDrawerAllocation"("sessionId");
CREATE FUNCTION protect_cash_drawer_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME <> 'CashDrawerSession' THEN RAISE EXCEPTION 'Cash drawer history is append-only'; END IF;
 IF OLD."status"='CLOSED' THEN RAISE EXCEPTION 'Cash drawer history is append-only'; END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Cash drawer sessions must be retained'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_cash_sessions BEFORE UPDATE OR DELETE ON "CashDrawerSession" FOR EACH ROW EXECUTE FUNCTION protect_cash_drawer_history();
CREATE TRIGGER protect_cash_movements BEFORE UPDATE OR DELETE ON "CashDrawerMovement" FOR EACH ROW EXECUTE FUNCTION protect_cash_drawer_history();
CREATE TRIGGER protect_cash_allocations BEFORE UPDATE OR DELETE ON "CashDrawerAllocation" FOR EACH ROW EXECUTE FUNCTION protect_cash_drawer_history();
