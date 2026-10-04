CREATE TABLE "AppointmentDepositIntent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "collectionMethod" TEXT,
    "reference" TEXT,
    "reason" TEXT,
    "settledById" TEXT,
    "settledAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppointmentDepositIntent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AppointmentDepositIntent_appointmentId_key" ON "AppointmentDepositIntent"("appointmentId");
CREATE UNIQUE INDEX "AppointmentDepositIntent_reference_key" ON "AppointmentDepositIntent"("reference");
CREATE INDEX "AppointmentDepositIntent_businessId_status_idx" ON "AppointmentDepositIntent"("businessId", "status");
ALTER TABLE "AppointmentDepositIntent" ADD CONSTRAINT "AppointmentDepositIntent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
