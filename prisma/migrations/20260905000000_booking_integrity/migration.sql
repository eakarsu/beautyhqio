BEGIN;
-- Fail safely if existing active bookings overlap; do not delete or reschedule data.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD COLUMN "requestHash" TEXT;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_valid_interval"
  CHECK ("scheduledEnd" > "scheduledStart");
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staff_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tsrange("scheduledStart", "scheduledEnd", '[)') WITH &&
  ) WHERE ("status" NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED'));
COMMIT;
