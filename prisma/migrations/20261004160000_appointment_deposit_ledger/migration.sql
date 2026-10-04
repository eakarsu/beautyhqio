CREATE TABLE "AppointmentDepositLedgerEntry" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "depositIntentId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "reference" TEXT,
  "transactionPaymentId" TEXT,
  "actorId" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentDepositLedgerEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppointmentDepositLedgerEntry_kind_check" CHECK ("kind" IN ('COLLECTED', 'APPLIED', 'REFUNDED')),
  CONSTRAINT "AppointmentDepositLedgerEntry_amount_check" CHECK (("kind" = 'COLLECTED' AND "amountCents" > 0) OR ("kind" IN ('APPLIED', 'REFUNDED') AND "amountCents" < 0)),
  CONSTRAINT "AppointmentDepositLedgerEntry_currency_check" CHECK ("currency" = 'USD')
);
CREATE UNIQUE INDEX "AppointmentDepositLedgerEntry_transactionPaymentId_key" ON "AppointmentDepositLedgerEntry"("transactionPaymentId");
CREATE UNIQUE INDEX "AppointmentDepositLedgerEntry_depositIntentId_kind_key" ON "AppointmentDepositLedgerEntry"("depositIntentId", "kind");
CREATE UNIQUE INDEX "AppointmentDepositLedgerEntry_businessId_reference_key" ON "AppointmentDepositLedgerEntry"("businessId", "reference");
CREATE INDEX "AppointmentDepositLedgerEntry_businessId_locationId_createdAt_idx" ON "AppointmentDepositLedgerEntry"("businessId", "locationId", "createdAt");
ALTER TABLE "AppointmentDepositLedgerEntry" ADD CONSTRAINT "AppointmentDepositLedgerEntry_depositIntentId_fkey" FOREIGN KEY ("depositIntentId") REFERENCES "AppointmentDepositIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Paid cash deposits from the earlier deposit-intent rollout retain their
-- collection evidence. A linked POS payment is the application, not another
-- physical cash receipt. Invalid legacy records remain blocked for review.
INSERT INTO "AppointmentDepositLedgerEntry" ("id", "businessId", "locationId", "depositIntentId", "kind", "amountCents", "currency", "reference", "actorId", "reason", "createdAt")
SELECT 'legacy-collect:' || i.id, i."businessId", a."locationId", i.id, 'COLLECTED', i."amountCents", i.currency, i.reference, i."settledById", i.reason, i."settledAt"
FROM "AppointmentDepositIntent" i JOIN "Appointment" a ON a.id = i."appointmentId"
WHERE i.status = 'PAID' AND i."collectionMethod" = 'CASH' AND i.currency = 'USD' AND i."amountCents" > 0
  AND i.reference IS NOT NULL AND i."settledById" IS NOT NULL AND i."settledAt" IS NOT NULL
  AND a."businessId" = i."businessId";

INSERT INTO "AppointmentDepositLedgerEntry" ("id", "businessId", "locationId", "depositIntentId", "kind", "amountCents", "currency", "transactionPaymentId", "actorId", "reason", "createdAt")
SELECT 'legacy-apply:' || i.id, i."businessId", a."locationId", i.id, 'APPLIED', -i."amountCents", i.currency, p.id, COALESCE(p."actorId", i."settledById"), 'Applied to linked POS sale before ledger rollout', p."createdAt"
FROM "AppointmentDepositIntent" i
JOIN "Appointment" a ON a.id = i."appointmentId"
JOIN "Transaction" t ON t."appointmentId" = a.id AND t."locationId" = a."locationId"
JOIN "TransactionPayment" p ON p."transactionId" = t.id AND p.method = 'CASH' AND p.source = 'CASH' AND p.reference = i.reference AND p."verifiedAt" IS NOT NULL
WHERE i.status = 'PAID' AND i."collectionMethod" = 'CASH' AND i.currency = 'USD' AND i."amountCents" > 0
  AND i."settledById" IS NOT NULL AND a."businessId" = i."businessId"
  AND EXISTS (SELECT 1 FROM "AppointmentDepositLedgerEntry" e WHERE e."depositIntentId" = i.id AND e.kind = 'COLLECTED');

UPDATE "AppointmentDepositIntent" i SET status = 'APPLIED', version = version + 1, "updatedAt" = CURRENT_TIMESTAMP
WHERE i.status = 'PAID' AND EXISTS (SELECT 1 FROM "AppointmentDepositLedgerEntry" e WHERE e."depositIntentId" = i.id AND e.kind = 'APPLIED');

-- If a legacy deposit credit already appeared in an approved drawer, mark the
-- corresponding collection as accounted for there. Closed snapshots remain intact.
INSERT INTO "CashDrawerAllocation" ("receiptKey", "sessionId", "amountCents")
SELECT 'deposit:' || e.id, a."sessionId", 0
FROM "AppointmentDepositLedgerEntry" e
JOIN "AppointmentDepositLedgerEntry" applied ON applied."depositIntentId" = e."depositIntentId" AND applied.kind = 'APPLIED'
JOIN "CashDrawerAllocation" a ON a."receiptKey" = 'payment:' || applied."transactionPaymentId"
WHERE e.kind = 'COLLECTED'
ON CONFLICT ("receiptKey") DO NOTHING;

-- Cash already on hand before a location's first physical drawer opening is
-- part of that opening count, including a legacy deposit with no POS sale yet.
INSERT INTO "CashDrawerAllocation" ("receiptKey", "sessionId", "amountCents")
SELECT 'deposit:' || e.id, first_session.id, 0
FROM "AppointmentDepositLedgerEntry" e
JOIN LATERAL (
  SELECT s.id, s."createdAt" FROM "CashDrawerSession" s
  WHERE s."locationId" = e."locationId" AND s."businessId" = e."businessId"
  ORDER BY s."createdAt", s.id LIMIT 1
) first_session ON e."createdAt" <= first_session."createdAt"
WHERE e.kind = 'COLLECTED' AND e.id LIKE 'legacy-collect:%'
ON CONFLICT ("receiptKey") DO NOTHING;

CREATE FUNCTION protect_appointment_deposit_ledger() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Appointment deposit ledger is append-only';
END $$;
CREATE TRIGGER "AppointmentDepositLedgerEntry_append_only" BEFORE UPDATE OR DELETE ON "AppointmentDepositLedgerEntry" FOR EACH ROW EXECUTE FUNCTION protect_appointment_deposit_ledger();
