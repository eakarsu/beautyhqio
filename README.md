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
