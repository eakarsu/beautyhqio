# BeautyHQ production operations

The supported primary journey is tenant-isolated salon appointment operations: an authenticated owner, manager, receptionist, or client creates an idempotent booking against active staff, location, client, and service records in the same business; staff conflicts are rejected; explicit confirmation, check-in, in-service, completion, cancellation, and no-show transitions are versioned and audited. Email, SMS, and calendar changes use a persistent outbox and never decide the authoritative booking result.

## Release and startup

Provision PostgreSQL outside the application container. Copy `.env.example` into a secret manager and replace every generated value. `start.sh` and the container entrypoint never install packages, create or reset databases, seed demo data, kill processes, or silently ignore migrations. A single release job may set `RUN_MIGRATIONS=true`; normal replicas must leave it false.

The checked-in Prisma migration is a baseline for new installations. For a database previously managed by `prisma db push`, back it up, compare it with the migration SQL, and use `prisma migrate resolve --applied 20260719000000_baseline_governed_operations` only after an operator verifies schema equivalence.

## Provider worker

Schedule authenticated `POST /api/cron/integration-deliveries` calls with `Authorization: Bearer $CRON_SECRET`. Deliveries move through `PENDING → PROCESSING → DELIVERED`, retry with bounded backoff, and become `DEAD_LETTER` after five attempts. Alert on any dead letter, old pending item, auth failure spike, or appointment conflict spike. Provider credentials are optional for core scheduling but required before enabling their delivery types.

## Identity and AI

Mobile access tokens expire after 15 minutes. Opaque refresh tokens are stored only as SHA-256 digests, rotate on every use, and are revocable at logout. The removed `/api/auth/mobile` assertion endpoint intentionally returns 410; use verified authorization-code OAuth through NextAuth.

AI routes default to disabled. Enable them only with `ENABLE_AI_FEATURES=true`, an evaluated OpenRouter account/model, privacy approval, cost limits, and human-review procedures. Requests require authentication; central AI responses use bounded retries, timeouts, and schema validation rather than generic fallback output. AI is never on the appointment state-transition path.

Legacy booking, marketplace, recurring, voice, and kiosk appointment-write routes are disabled in production by default because they do not yet meet the governed workflow contract. Keep `ENABLE_LEGACY_APPOINTMENT_WRITES=false` until each route uses the central permission, idempotency, conflict, audit, and outbox service and receives equivalent test coverage.

Back up PostgreSQL and the configured upload store together, encrypt them, enforce retention, and run restore drills. Do not put certificate archives, account exports, or live credentials in the repository.

## September 2026 security and booking update

Run `npm ci`, `npx prisma generate`, and `npx prisma migrate deploy` before starting
the updated application. Migration `20260905000000_booking_integrity` requires
PostgreSQL's `btree_gist` extension and adds an exclusion constraint against staff
overlaps. It runs atomically and refuses existing overlapping active appointments
or invalid intervals; resolve those records deliberately before retrying a failed
migration. No production records are automatically rescheduled or deleted.

Old appointment idempotency keys without a request hash return 409. Retrieve the
existing appointment instead of submitting a new booking to resolve an old retry.
New retries preserve their keys and reject changes to the original request.

New accounts created without an explicit password use Forgot password to set one.
Accounts previously saved with plaintext passwords also need password reset; do
not distribute or reuse those old values. Existing web sessions re-read the user
record so deactivation and role changes take effect on the next request.

The provider worker reclaims PROCESSING deliveries after a five-minute expired
lease, renews active leases, and fences stale workers using attempt numbers.
Delivery remains at least once: a crash after a provider accepts a message but
before its result is saved can cause a duplicate on retry.

For isolated HTTP/browser tests, start the server with a local test database and
set `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_EXTERNAL_SERVER=true`. The governed suite
now tests both booking forms, the lifecycle, API access denial, password creation,
and session permission revocation. Database tests mock notification providers.
