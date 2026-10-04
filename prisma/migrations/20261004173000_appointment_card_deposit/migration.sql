CREATE TABLE "AppointmentDepositCheckout" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "depositIntentId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "requestKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "providerRef" TEXT,
  "paymentIntentId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppointmentDepositCheckout_amount_check" CHECK ("amountCents" > 0 AND "currency" = 'USD'),
  CONSTRAINT "AppointmentDepositCheckout_status_check" CHECK ("status" IN ('PENDING','OPEN','UNKNOWN','PAID','FAILED','EXPIRED')),
  CONSTRAINT "AppointmentDepositCheckout_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AppointmentDepositCheckout_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AppointmentDepositCheckout_depositIntentId_fkey" FOREIGN KEY ("depositIntentId") REFERENCES "AppointmentDepositIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AppointmentDepositCheckout_businessId_requestKey_key" ON "AppointmentDepositCheckout"("businessId","requestKey");
CREATE UNIQUE INDEX "AppointmentDepositCheckout_providerRef_key" ON "AppointmentDepositCheckout"("providerRef");
CREATE UNIQUE INDEX "AppointmentDepositCheckout_paymentIntentId_key" ON "AppointmentDepositCheckout"("paymentIntentId");
CREATE INDEX "AppointmentDepositCheckout_businessId_depositIntentId_status_idx" ON "AppointmentDepositCheckout"("businessId","depositIntentId","status");

CREATE TABLE "AppointmentDepositRefund" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "depositIntentId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "providerRef" TEXT,
  "reason" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppointmentDepositRefund_amount_check" CHECK ("amountCents" > 0 AND "currency" = 'USD'),
  CONSTRAINT "AppointmentDepositRefund_status_check" CHECK ("status" IN ('PENDING','UNKNOWN','PROCESSING','SUCCEEDED','FAILED')),
  CONSTRAINT "AppointmentDepositRefund_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AppointmentDepositRefund_depositIntentId_fkey" FOREIGN KEY ("depositIntentId") REFERENCES "AppointmentDepositIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AppointmentDepositRefund_providerRef_key" ON "AppointmentDepositRefund"("providerRef");
CREATE INDEX "AppointmentDepositRefund_businessId_depositIntentId_status_idx" ON "AppointmentDepositRefund"("businessId","depositIntentId","status");

-- A captured card deposit becomes a verified POS credit exactly once.
CREATE UNIQUE INDEX "TransactionPayment_verified_stripe_receipt_any_source" ON "TransactionPayment"("stripePaymentId") WHERE "stripePaymentId" IS NOT NULL AND "verifiedAt" IS NOT NULL;
