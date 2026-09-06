# BeautyHQ

BeautyHQ is a multi-tenant beauty and wellness operations application. Its
supported production workflow is authenticated appointment booking and
lifecycle management backed by PostgreSQL.

An owner, manager, receptionist, or linked client can create an idempotent
appointment only with active staff, location, client, and service records in
the correct tenant. Overlaps are rejected. Confirmation, check-in, service
start, completion, cancellation, and no-show are explicit versioned
transitions. Every accepted state change is audited; provider work is written
to a durable retry/dead-letter outbox.

## Local verification

1. Install Node.js 22 and PostgreSQL 17.
2. Copy `.env.example` to `.env.local`, replace all required values, and create
   an empty database. Never use the example values in production.
3. Run `npm ci`, `npx prisma migrate deploy`, then `npm run dev`.

The release gates are:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
npm run audit:prod
```

The real HTTP journey additionally uses `ALLOW_E2E_SEED=true npm run
seed:governed` against an explicitly local/test database followed by `npm run
test:governed`. The seed command refuses non-test targets.

See `OPERATIONS.md` for migration, deployment, backup, provider-worker, AI, and
legacy-route controls. See `SECURITY_INCIDENT.md` before any release: tracked
credential inventories and certificate private keys were found and removed,
so owner-side rotation and Git-history cleanup remain mandatory.

## Local sample data

After configuring the existing administrator and deploying migrations, run
`npm run demo-data:load` to add fictional sample records to the local database.
`npm run demo-data:verify` also reloads them and verifies that records and the
administrator are unchanged. Records persist across restarts; existing edits are
preserved and deterministic IDs prevent duplicates.

To restore missing samples during local startup, set `LOAD_DEMO_DATA=true` in the
ignored `.env`. It defaults to false. The loader refuses production mode and remote
databases. It does not send messages, run AI, charge cards, or manufacture provider
receipts. Demo requests remain pending/draft and demo promotions remain inactive.
Appointment dates are set on the first load and are preserved thereafter; use the
date controls to view them on later days.

The supplemental loader expects the original salon catalog and clients to exist.
The booking-integrity migration preserves legacy overlapping appointments and uses
a serialized database trigger to reject new overlaps. Databases without legacy
overlaps use the exclusion constraint. Existing overlaps still need staff review;
the migration does not reschedule or cancel them. Restart the Next server after
updating/building the application so its routes match the installed build.

`npm run test:booking-migration` checks clean and legacy-overlap migrations in
isolated schemas and rolls both back. It requires local PostgreSQL and `psql`.

When running the portfolio locally, include `connection_limit=2&pool_timeout=30`
in the PostgreSQL `DATABASE_URL` query parameters to keep simultaneous apps from
exhausting the shared database connection limit. Restart after changing .env.

### Subscription billing and recovery

Owners select plans in **My Subscription**. Paid selections open actual Stripe Checkout; an existing subscription opens Stripe's billing portal. A paid plan is shown only after current provider subscription/invoice verification. **Billing requests** supports reconciliation by the provider checkout session ID and expiration of an open checkout. Keep the same request on network failure; old uncertain requests are held for reconciliation rather than creating another checkout.

The platform billing account uses `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; this is separate from a salon's POS provider connection. Configure `/api/webhooks/stripe` for subscription, invoice and checkout events. Run provider test-account acceptance before enabling real customers. See `FEATURE_STATUS.md` for current scope and unfinished POS/payment work.

Startup preserves existing administrators and demo role accounts. AI is optional. Demo seeding runs only when `LOAD_DEMO_DATA=true`; login autofill defaults off. Startup builds current code unless `BUILD_ON_START=false` is explicitly set for an already-built checkout. The startup build explicitly uses `NODE_ENV=production`, including when the local `.env` selects development mode.

POS workflow: open `/pos`, have an owner/manager review the actual sales-tax settings, save a sale, review its saved prices and tax, then record received cash/gift-card tenders or use salon Stripe checkout. Partial cash/gift payments are supported. Refunds require manager authority and original verified receipts; cash refunds require confirmation of the actual return. Void an unpaid draft to release its tracked stock. A completed appointment's checkout link imports services at current catalog prices for review; automatic add-on import is unavailable.

Salon payments use the encrypted per-business Stripe connection (including its webhook signing secret) and `/api/operations/stripe-hook/<businessId>`, separately from platform subscription billing. Configure checkout completed/expired/async payment succeeded/failed and refund created/updated/failed events. Use POS reconciliation after uncertain outcomes; never create another charge to resolve an unknown receipt. Real provider test-account and hardware acceptance remain outstanding. See `FEATURE_STATUS.md` for verified scope and remaining work.

Run `node scripts/test-operations.cjs` for isolated local PostgreSQL tests; it creates and removes a separate schema per suite. A supported test file path may be supplied to run one suite. The September 6 POS checkpoint passed 82 unit tests, 20 PostgreSQL tests, TypeScript, production build and authenticated browser reads.

Run `npm run test:restore` to create a private backup, restore it into a disposable local PostgreSQL database, and read all restored public tables. It requires local PostgreSQL tools and permission to create a temporary database. The backup remains under `~/.codex/backups/<project>/`; the temporary database is removed after the check. The September 6 full restore rehearsal passed.

### Cash drawer closeout

Open **Cash drawer** with an owner, manager or receptionist business account. Establish the first physical opening balance; it includes cash activity before opening. Record actual float additions, withdrawals or safe deposits with reasons. Refresh the selected drawer, enter the physical count and submit it for review. A different owner/manager must approve any variance; an exact count may be approved by the same manager.

Later sessions carry forward the last approved physical count. New verified cash activity after submission is allocated to the next session, including activity between sessions. Each cash payment/refund is counted once. Closed history is immutable; approved closeouts can be exported as CSV. The workflow supports one shared USD drawer per location and does not command physical drawer hardware or initiate bank movements. More than 10,000 unallocated payments or refunds requires historical reconciliation before opening/counting; close out regularly.

`node scripts/test-operations.cjs` runs all isolated PostgreSQL suites, including cash closeout. The browser acceptance checkpoint used disposable fixture data and no provider actions.
