# BeautyHQ audit — wrongly implemented features

**Date:** 2026-09-30
**Method:** static inspection of application source (`src/app/api`, `src/lib`, `src/middleware.ts`)
plus line-by-line verification of each finding. No documentation or prior report was trusted.
**Scope:** correctness of implemented features. Completeness is covered by `FEATURE_STATUS.md`;
the test harness is a separate matter.

---

## Correction to an earlier draft

A first pass flagged **97 routes**, including all 20 `ai/*` handlers. That was wrong:
`src/middleware.ts` gates every `/api/ai/*` path (except `/api/ai/consent` and
`/api/ai/audit-log`) behind a NextAuth token check plus an `ENABLE_AI_FEATURES` flag, and
returns 401 when unauthenticated. The `ai/*` routes are therefore **protected**, and the
count below excludes them. This correction matters — the real number is smaller and the
list is different.

---

## Summary

| # | Finding | Severity |
|---|---|---|
| 1 | **~90 API routes query the database with no authentication and no tenant scoping** | **Critical** |
| 2 | `/api/business` returns every tenant's records to anonymous callers | **Critical** |
| 3 | `/api/search` searches all tenants' clients with no auth or scope | **Critical** |
| 4 | `/api/upload` writes files with no auth, no tenant scope, caller-controlled path | **High** |
| 5 | `/api/kiosk/lookup` exposes client PII by phone number, unauthenticated, unthrottled | **High** |
| 6 | Financial/payroll reports (`reports/*`, `commissions`, `tips`) are unscoped | **High** |
| 7 | Middleware protects only `/api/ai/*`; everything else passes through untouched | **Root cause of 1–6** |

These are auth/tenant-boundary defects in running code. They are the same class the July
completeness review flagged. The September work hardened a *governed subset* — the
`src/lib/operations/*` modules reached through `endpoint()` / `context()` — and that subset
is genuinely correct. The legacy handlers behind it were never migrated.

---

## Finding 7 — the middleware is the root cause

```ts
// src/middleware.ts
const isAiRoute =
  (pathname.startsWith("/api/ai/") && !["/api/ai/consent", "/api/ai/audit-log"].includes(pathname))
  || pathname === "/api/recovery-coach";
if (isAiRoute) { /* require ENABLE_AI_FEATURES + getToken() */ }
// ...everything else falls through to NextResponse.next()
```

`config.matcher` is `["/api/:path*"]`, so middleware *runs* for all API traffic — but it
only **enforces** auth for the `/api/ai/*` prefix. It also adds CORS and security headers
(which is correct and useful), and retires three legacy voice writes in production.

**Impact:** the AI surface is protected; roughly ninety other routes are not. Any
unauthenticated client can reach them.

---

## Finding 1 — unscoped, unauthenticated database routes

**Detection**

For every `src/app/api/**/route.ts`, excluding `auth/`, `webhooks/`, `cron/`, `health`,
`ai/*` and `recovery-coach` (all covered by middleware or legitimately public), flag files
that:

- have no auth call (`context(`, `endpoint(`, `getAuthenticatedUser`, `requireAuth`,
  `requireRole`, `requireCron`, `getServerSession`), **and**
- contain no `businessId` anywhere, **and**
- do call `prisma.`

**Representative families affected**

| Family | Examples |
|---|---|
| Client PII | `clients/[id]/photos`, `clients/family`, `clients/duplicates`, `clients/merge` |
| Money | `reports/revenue`, `reports/client-analytics`, `reports/staff-performance`, `reports/services`, `commissions`, `tips`, `tips/staff/[staffId]` |
| Commerce | `gift-cards/[id]`, `gift-cards/check-balance`, `packages/[id]/purchase`, `memberships/[id]/subscribe`, `loyalty/earn`, `loyalty/account/[clientId]` |
| Operations | `inventory/[id]`, `group-appointments/*`, `services/[id]/addons`, `staff/[id]`, `suppliers/[id]`, `notes/*`, `messages`, `export` |
| Voice | `voice/incoming`, `voice/menu`, `voice/voicemail`, `voice/transcription`, `voice/book` |
| Integrations | `quickbooks/*`, `calendar/*` |

**Impact:** read and/or write access to other tenants' records depending on the route.
`clients/merge` can destroy data. `export` can exfiltrate a table.

**Not a grep artefact** — Findings 2–5 were read line by line.

---

## Finding 2 — `/api/business` leaks all tenants (verified)

```ts
// src/app/api/business/route.ts
export async function GET() {
  const businesses = await prisma.business.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(businesses);
}
```

No auth, no `businessId` filter, no pagination. Returns the entire `Business` table.
Not an `/api/ai/*` path, so middleware does not gate it.

**Impact:** full customer enumeration to any anonymous caller.

---

## Finding 3 — `/api/search` leaks all clients (verified)

```ts
// src/app/api/search/route.ts
const clients = await prisma.client.findMany({
  where: { OR: [
    { firstName: { contains: searchTerm, mode: "insensitive" } },
    { lastName:  { contains: searchTerm, mode: "insensitive" } },
    { email:     { contains: searchTerm, mode: "insensitive" } },
    { phone:     { contains: searchTerm } },
  ]},
  select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  take: limit,
});
```

No authentication, no `businessId` in the `where`. A two-character query such as `?q=an`
returns matching clients **across every tenant**, with email and phone.

**Impact:** bulk PII extraction by iterating common substrings. Most serious read exposure found.

---

## Finding 4 — `/api/upload` accepts anonymous writes (verified)

```ts
// src/app/api/upload/route.ts
const type = formData.get("type") as string || "general";
const entityId = formData.get("entityId") as string;
// type/size validation only
const uploadDir = join(process.cwd(), "public", "uploads", type);
await writeFile(filePath, buffer);
return NextResponse.json({ success: true, url: publicUrl, ... });
```

No auth, no tenant scope, no ownership check on `entityId`. The caller chooses the
subdirectory via `type` and influences the filename via `entityId`.

**Impact:** anonymous file write into a web-served directory; PDFs are accepted and served
same-origin. A caller can also collide with another tenant's file naming.

---

## Finding 5 — `/api/kiosk/lookup` exposes client PII (verified)

```ts
// src/app/api/kiosk/lookup/route.ts
// Public, unauthenticated endpoint for kiosks to find a client's appointments today.
const where = {
  scheduledStart: { gte: startOfDay, lte: endOfDay },
  OR: [
    { client: { phone: { in: phoneVariants } } },
    { client: { mobile: { in: phoneVariants } } },
    { clientPhone: { in: phoneVariants } },
  ],
};
if (locationId) where.locationId = locationId;   // optional
```

No token, no rate limit, no captcha. With `locationId` omitted it searches **all locations
of all businesses**. The response includes client first/last name, phone, and the full
appointment list with services and staff.

**Impact:** enumerate customers by phone number and learn their appointment history. The
comment documents the intent but nothing constrains it — no per-kiosk secret, no throttle.

---

## What is **not** wrong (verified correct)

| Area | Verification |
|---|---|
| **AI surface auth** | Middleware requires a NextAuth token for `/api/ai/*`; returns 401 otherwise, and 503 when `ENABLE_AI_FEATURES` is off |
| **Skin kiosk multimodal** | Sends a real `image_url` content block; prompt forbids diagnosis, health scores, clinical claims; requires recorded consent; a `CLIENT` can only submit their own photos; zod-validated model output |
| **Wearables** | Honest — returns `nativeAuthorizationRequired`, records provenance as *"not independently attested"*, never invents samples |
| **Campaign sending** | Queues consenting recipients; no simulated success |
| **Governed booking** | `src/lib/appointments/*` enforces tenant scope, overlap, idempotency, versioned transitions, audit |
| **Security headers / CORS** | Applied to all `/api/*` via middleware; production refuses wildcard origins |

`ai/skin-kiosk` is the correct pattern for this codebase: auth via `context([...roles])`,
tenant check, consent gate, input validation, schema-checked output. The flagged routes
should be brought onto it.

---

## Recommended remediation

1. **Immediate (small diffs, highest impact):** add auth + `businessId` scoping to
   `/api/business`, `/api/search`, `/api/upload`, `/api/kiosk/lookup`.
2. **Systemic:** migrate the remaining legacy handlers onto the existing
   `endpoint()` / `context()` wrappers so auth and tenant checks become structural rather
   than per-file. The wrapper already exists and is proven by the governed routes.
3. **Regression guard:** add a test that walks `src/app/api/**/route.ts` and fails any
   handler touching `prisma` without an auth call and a tenant scope. Cheap, and it
   prevents this class of bug recurring. (Note: this audit used exactly that heuristic
   manually.)
4. **Kiosk:** issue a per-location kiosk token and require it instead of relying on the
   endpoint being "public".
5. **Middleware:** consider inverting the logic — require authentication by default and
   allow-list the genuinely public paths (`auth/*`, `webhooks/*`, `cron/*`, kiosk with
   token, booking availability). Default-deny is safer than the current default-allow.

---

## Caveats

- **Static analysis only.** I did not send requests to a running instance, so no live
  exploit was demonstrated. The code paths are unambiguous, but runtime confirmation is
  the operator's step.
- **Heuristic scope.** Findings 1 and 6 come from a pattern match over ~297 route files;
  Findings 2–5 were read in full. A route could conceivably enforce auth through a helper
  whose name I did not include — I checked the obvious ones (`context`, `endpoint`,
  `getAuthenticatedUser`, `require*`, `getServerSession`) and the wrapper actually in use
  is `context`/`endpoint`.
- **Middleware reruns per request** in Next; the `/api/ai/*` gate is real, not
  build-time.
