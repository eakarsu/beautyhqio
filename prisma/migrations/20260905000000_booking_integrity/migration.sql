BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD COLUMN "requestHash" TEXT;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_valid_interval"
  CHECK ("scheduledEnd" > "scheduledStart");

-- Legacy imports may contain overlaps. Preserve them while preventing new ones.
-- Clean databases retain the exclusion constraint (including concurrent writes).
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "Appointment" a JOIN "Appointment" b
      ON a.id < b.id AND a."staffId" = b."staffId"
      AND a."scheduledStart" < b."scheduledEnd" AND b."scheduledStart" < a."scheduledEnd"
    WHERE a.status NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED')
      AND b.status NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED')
  ) THEN
    ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staff_no_overlap"
      EXCLUDE USING gist (
        "staffId" WITH =,
        tsrange("scheduledStart", "scheduledEnd", '[)') WITH &&
      ) WHERE ("status" NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED'));
  ELSE
    RAISE NOTICE 'Existing appointment overlaps preserved; enforcing new bookings with a serialized trigger';
  END IF;
END
$migration$;

CREATE FUNCTION enforce_appointment_staff_interval() RETURNS trigger
LANGUAGE plpgsql AS $function$
BEGIN
  IF NEW.status IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW."staffId" = OLD."staffId" AND NEW."scheduledStart" = OLD."scheduledStart"
       AND NEW."scheduledEnd" = OLD."scheduledEnd"
       AND OLD.status NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED') THEN
      RETURN NEW;
    END IF;
  END IF;
  -- A row write serializes competing bookings, including repeatable-read transactions.
  -- The value is unchanged; no staff data or timestamps are altered.
  UPDATE "Staff" SET "updatedAt" = "updatedAt" WHERE id = NEW."staffId";
  IF EXISTS (
    SELECT 1 FROM "Appointment" a WHERE a.id <> NEW.id AND a."staffId" = NEW."staffId"
      AND a.status NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED')
      AND a."scheduledStart" < NEW."scheduledEnd" AND NEW."scheduledStart" < a."scheduledEnd"
  ) THEN
    RAISE EXCEPTION 'Appointment_staff_no_overlap' USING ERRCODE = '23P01', CONSTRAINT = 'Appointment_staff_no_overlap';
  END IF;
  RETURN NEW;
END
$function$;
DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_staff_no_overlap' AND conrelid = '"Appointment"'::regclass) THEN
    CREATE TRIGGER "Appointment_staff_no_overlap_guard"
      BEFORE INSERT OR UPDATE OF "staffId", "scheduledStart", "scheduledEnd", status
      ON "Appointment" FOR EACH ROW EXECUTE FUNCTION enforce_appointment_staff_interval();
  END IF;
END
$migration$;
COMMIT;
