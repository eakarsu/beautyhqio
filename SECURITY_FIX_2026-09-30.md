# Security remediation — unauthenticated and unscoped API routes

**Date:** 2026-09-30
**Scope:** auth + tenant isolation on the legacy API surface (the finding in
`AUDIT_WRONG_FEATURES_2026-09-30.md`).
**Status:** complete, verified statically. Runtime verification against a live database
and real provider callbacks has **not** been performed.

---

## Result

| Metric | Before | After |
|---|---|---|
| Routes touching the DB with no auth **and** no tenant scope | **91** | **0** |
| `npx tsc --noEmit` | clean | clean |
| `npm run test:unit` | 82 passed / 1 false-failing suite | **85 passed / 0 failed** |
| `npm run build` | passes | passes |
| `npx eslint` | 0 errors | 0 errors |
| Files changed | — | 113 |

A new CI guard (`src/lib/__tests__/api-route-auth.test.ts`) enforces this class of bug
permanently: it walks every `src/app/api/**/route.ts`, and fails any handler that touches
`prisma` without either a user-auth call, a recognised provider-signature check, or a
tenant scope.

---

## How the fix was applied

Every route now follows the codebase's existing governed pattern
(`src/lib/operations/core.ts`):

```ts
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    return prisma.model.findMany({ where: { businessId: ctx.businessId } });
  });
}
```

`context()` supplies the 401/403 gate, `endpoint()` supplies error handling, and every
query is constrained to `ctx.businessId` — directly where the model has the column, or
through a relation where it does not (`Staff` → `location.businessId`, `ClientNote` →
`client.businessId`, `Transaction` → `location.businessId`, etc.).

Also applied throughout:

- replaced `findUnique({ where: { id } })` with `findFirst({ where: { id, businessId } })`
  so a cross-tenant id cannot be read
- verified referenced ids in write bodies (`clientId`, `staffId`, `locationId`,
  `appointmentId`) belong to the caller's tenant before use
- removed `try/catch → generic 500` wrappers in favour of `endpoint()`
- added zod validation and capped query params (`limit` ≤ 200)
- replaced `data: body` mass-assignment with explicit field allow-lists, closing the
  "move a record to another tenant by passing `businessId`" hole

---

## The 5 highest-impact routes (fixed and verified by hand)

| Route | Before | After |
|---|---|---|
| `/api/business` | returned **every tenant's** records anonymously | scoped to caller's business |
| `/api/search` | searched **all tenants' clients** (name, email, phone) | scoped; limit capped |
| `/api/upload` | anonymous write, caller-controlled path | authenticated; allow-listed directory; per-tenant prefix; server-generated filename; extension from validated MIME |
| `/api/kiosk/lookup` | client PII by phone, unthrottled, all locations | requires an HMAC kiosk token bound to one location; requires a full 10-digit number |
| `/api/kiosk/services` | arbitrary "first active" business | requires the kiosk token |

---

## New capabilities added

- **`src/lib/operations/kiosk-token.ts`** — kiosk devices authenticate with an HMAC token
  bound to one location, derived from `KIOSK_TOKEN_SECRET` (falls back to
  `NEXTAUTH_SECRET`). No storage required; rotate by changing the secret.
- **`src/lib/kiosk-client.ts`** — kiosk pages read `?kioskToken=...` once, persist it, and
  attach it to every kiosk request.
- **`src/lib/operations/core.ts` → `platformContext()`** — a platform-admin-only gate for
  data that belongs to no tenant.
- **`/api/public/locations`** — a deliberately public, minimal-projection endpoint for the
  online booking flow (replaces the booking page's use of the now-gated `/api/locations`).

---

## Routes deliberately left public, and why

Each is wrapped in `endpoint()` for uniform error handling and returns a minimal
projection. None expose tenant internals or PII.

| Route | Why public |
|---|---|
| `/api/public/locations` | customers pick a salon before they have an account |
| `/api/booking/availability` | anonymous visitors must see slots before signing in |
| `/api/marketplace/salons`, `/api/marketplace/salons/[slug]` | public storefront listings; only listed/active businesses, public fields, reviews reduced to first name + last initial |
| `/api/marketplace/leads/track` | anonymous storefront analytics; writes only lead rows |
| `/api/kiosk/walk-in` | kiosk browser; authenticated by kiosk token |
| `/api/contact` (POST only) | the marketing site's anonymous contact form; `ContactMessage` has no tenant |
| `/api/auth/*`, `/api/webhooks/*`, `/api/cron/*` | sign-in, provider callbacks with signatures, timing-safe cron auth |

### Provider-initiated routes

Authenticated by **signature**, not session, and they fail closed:

- Twilio IVR (`voice/incoming`, `voice/menu`, `voice/voicemail`, `voice/transcription`,
  `voice/confirm-booking`) — `twilio.validateRequest` against `TWILIO_AUTH_TOKEN`;
  returns **503 when the token is unset** so a missing secret cannot silently disable auth.
- Stripe (`operations/stripe-hook/[businessId]`) — `constructEvent` against the
  per-business webhook secret.
- OAuth callbacks (`calendar/**/callback`, `quickbooks/callback`) — bound to the
  authenticated session; the referenced record is verified against `ctx.businessId`, and a
  query-string `businessId` is never trusted. Redirect targets are restricted to relative
  paths, closing an open-redirect.

---

## Known limitations and follow-ups

These are real and were surfaced by the work rather than hidden by it:

1. **OAuth `state` is unsigned.** The `/auth` routes build state as plain base64 (QuickBooks
   uses a constant), so login-CSRF cannot be fully eliminated at the callback. The callbacks
   are mitigated by requiring a session and verifying tenant ownership, and a
   `TODO(security)` marks where HMAC state signing must be added. **The `/auth` routes are
   the correct place to fix this.**
2. **QuickBooks migration.** Tokens previously stored in the global `Settings` singleton
   (which leaked across tenants) now live in the per-tenant `IntegrationConnection`, encrypted
   with `INTEGRATION_ENCRYPTION_KEY`. A tenant that connected before must reconnect; the
   callback fails closed (503) if the key is unset.
3. **Two models have no tenant column.** `ContactMessage` (marketing inbox) and `Lead`
   (the platform's own sales pipeline) are platform-level, not tenant data. They are now
   gated by `platformContext()` (platform admins only) rather than pretending to be
   tenant-scoped. A schema change would be needed to make them per-tenant.
4. **Kiosk devices need provisioning.** `kiosk/lookup`, `kiosk/services` and `kiosk/walk-in`
   now require `?kioskToken=...`. Existing kiosk installations will return 401 until the
   device URL is updated. `KIOSK_TOKEN_SECRET` should be set; without it the routes fail
   closed.
5. **`/api/locations` is now staff-only.** The public `/book` page was moved to
   `/api/public/locations`. Any other unauthenticated consumer of `/api/locations` would
   now receive 401 — none were found, but this is a behaviour change.
6. **`reports/inventory` and similar raw-SQL routes** scope by adding
   `AND business_id = $n`. Columns come only from a fixed allow-list and all values are
   parameterised, so there is no new injection surface, but the raw SQL style itself is a
   latent risk worth replacing with Prisma.
7. **No live verification.** Every check here is static (types, tests, lint, build). The
   routes were not exercised against a running database, and no real Twilio/Stripe callback
   was sent. Runtime smoke tests are the operator's next step.

---

## Verification commands

```bash
cd /Volumes/external/projects/beautyhqio
npx tsc --noEmit                 # clean
npm run test:unit                # 85 passed, 0 failed
npm run build                    # succeeds
npx eslint .                     # 0 errors
npx jest src/lib/__tests__/api-route-auth.test.ts   # 3 passed (0 unscoped routes)
```
