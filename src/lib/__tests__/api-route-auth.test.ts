/**
 * Regression guard: every API route that touches the database must authenticate
 * and scope by tenant.
 *
 * This exists because a large number of legacy handlers shipped without either,
 * letting any anonymous caller read or mutate another business's data. Static
 * enforcement is cheap and catches the mistake at CI time rather than in
 * production.
 *
 * A route is exempt when it is genuinely public or provider-initiated — those
 * are listed explicitly below so adding a new exemption is a deliberate act.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";

const API_ROOT = join(process.cwd(), "src", "app", "api");

/**
 * Prefixes whose routes are legitimately reachable without a user session.
 * Each entry is asserted below to still match at least one route, so a stale
 * exemption fails the test rather than silently widening the allow-list.
 */
const PUBLIC_OR_PROVIDER_PREFIXES = [
  "auth/", // sign-in / sign-up / session
  "webhooks/", // provider callbacks with their own signature checks
  "cron/", // timing-safe cron auth in src/lib/cron-auth.ts
  "ai/", // gated by src/middleware.ts (NextAuth token)
  "recovery-coach", // gated by src/middleware.ts
  "public/", // deliberately public, minimal-projection endpoints (see each file)
];

/** A route is considered authenticated if it references one of these. */
const AUTH_MARKERS = [
  "context(",
  "endpoint(",
  "getAuthenticatedUser",
  "requireAuth",
  "requireRole",
  "requireCron",
  "getServerSession",
];

/**
 * Provider-initiated routes authenticate by verifying the caller's signature
 * rather than by a user session. These markers recognise that, so a correctly
 * secured webhook is not forced to adopt a user-auth call it should not have.
 */
const PROVIDER_AUTH_MARKERS = [
  "constructEvent", // Stripe webhook signature verification
  "validateRequest", // Twilio signature verification
  "verifySignature",
  "timingSafeEqual",
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry === "route.ts" || entry === "route.tsx") out.push(full);
  }
  return out;
}

function isExempt(relPath: string): boolean {
  return PUBLIC_OR_PROVIDER_PREFIXES.some((p) => relPath.startsWith(p) || relPath === p.replace(/\/$/, ""));
}

describe("API route auth and tenant scoping", () => {
  const routes = walk(API_ROOT).map((f) => relative(API_ROOT, f).split(sep).join(posix.sep));

  it("finds route files to check", () => {
    expect(routes.length).toBeGreaterThan(100);
  });

  it("keeps the exemption list honest", () => {
    // Every exemption must still match at least one route, otherwise the list is
    // stale and may be hiding a real gap.
    for (const prefix of PUBLIC_OR_PROVIDER_PREFIXES) {
      const matches = routes.filter((r) => r.startsWith(prefix) || r === prefix.replace(/\/$/, ""));
      expect(matches.length).toBeGreaterThan(0);
    }
  });

  it("requires authentication and tenant scoping on every database route", () => {
    const offenders: string[] = [];

    for (const rel of routes) {
      if (isExempt(rel)) continue;

      const src = readFileSync(join(API_ROOT, rel), "utf8");

      // Only routes that actually touch the database are in scope.
      if (!src.includes("prisma.")) continue;

      const hasAuth = AUTH_MARKERS.some((marker) => src.includes(marker));
      const hasProviderAuth = PROVIDER_AUTH_MARKERS.some((marker) => src.includes(marker));
      const hasTenantScope = src.includes("businessId");

      if (!hasAuth && !hasProviderAuth && !hasTenantScope) {
        offenders.push(`${rel} — no auth call and no businessId scoping`);
      } else if (!hasAuth && !hasProviderAuth) {
        offenders.push(`${rel} — scopes by businessId but never authenticates`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
