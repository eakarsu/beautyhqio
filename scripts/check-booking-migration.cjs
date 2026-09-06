// Exercise the migration in isolated schemas, rolled back after each case.
const fs = require('node:fs');
const { parseEnv } = require('node:util');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const project = path.resolve(__dirname, '..');
const config = parseEnv(fs.readFileSync(path.join(project, '.env'), 'utf8'));
const url = new URL(process.env.DATABASE_URL || config.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('This check requires a local database');
const migration = fs.readFileSync(path.join(project, 'prisma/migrations/20260905000000_booking_integrity/migration.sql'), 'utf8').replace(/^BEGIN;/, '').replace(/COMMIT;\s*$/, '');
for (const legacy of [false, true]) {
  const schema = `booking_check_${process.pid}_${legacy ? 'legacy' : 'clean'}`;
  const sql = `BEGIN;
CREATE SCHEMA "${schema}";
SET LOCAL search_path TO "${schema}", public;
CREATE TABLE "Staff" (id text PRIMARY KEY, "updatedAt" timestamp NOT NULL DEFAULT now());
CREATE TABLE "Appointment" (id text PRIMARY KEY, "staffId" text NOT NULL, "scheduledStart" timestamp NOT NULL, "scheduledEnd" timestamp NOT NULL, status text NOT NULL);
INSERT INTO "Staff" (id) VALUES ('fixture-staff');
INSERT INTO "Appointment" VALUES ('original','fixture-staff','2030-01-01 10:00','2030-01-01 11:00','BOOKED');
${legacy ? `INSERT INTO "Appointment" VALUES ('legacy-overlap','fixture-staff','2030-01-01 10:30','2030-01-01 11:30','BOOKED');` : ''}
${migration}
DO $check$
BEGIN
  IF (SELECT count(*) FROM "Appointment") <> ${legacy ? 2 : 1} THEN RAISE EXCEPTION 'Existing records changed'; END IF;
  BEGIN
    INSERT INTO "Appointment" VALUES ('conflict','fixture-staff','2030-01-01 10:15','2030-01-01 10:45','BOOKED',NULL);
    RAISE EXCEPTION 'Overlapping insert accepted';
  EXCEPTION WHEN exclusion_violation THEN NULL;
  END;
  INSERT INTO "Appointment" VALUES ('adjacent','fixture-staff','2030-01-01 11:30','2030-01-01 12:00','BOOKED',NULL);
  BEGIN
    UPDATE "Appointment" SET "scheduledStart"='2030-01-01 10:45' WHERE id='adjacent';
    RAISE EXCEPTION 'Overlapping reschedule accepted';
  EXCEPTION WHEN exclusion_violation THEN NULL;
  END;
  INSERT INTO "Appointment" VALUES ('cancelled','fixture-staff','2030-01-01 10:00','2030-01-01 11:00','CANCELLED',NULL);
  BEGIN
    UPDATE "Appointment" SET status='BOOKED' WHERE id='cancelled';
    RAISE EXCEPTION 'Overlapping reactivation accepted';
  EXCEPTION WHEN exclusion_violation THEN NULL;
  END;
  IF NOT EXISTS (SELECT 1 FROM "Appointment" WHERE id='original' AND "scheduledStart"='2030-01-01 10:00' AND status='BOOKED') THEN RAISE EXCEPTION 'Original booking changed'; END IF;
END
$check$;
ROLLBACK;`;
  const result = spawnSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1'], {
    input: sql, encoding: 'utf8',
    env: { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: decodeURIComponent(url.pathname.slice(1)) },
  });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'Migration check failed');
  console.log(`${legacy ? 'Legacy overlap' : 'Clean database'} migration: inserts, reschedules, reactivation, adjacency and preservation passed (rolled back)`);
}
