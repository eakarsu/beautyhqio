/**
 * Apple Health integration — status stub (apply pass 7 — backlog #4).
 *
 * NEEDS-CREDS: requires APPLE_HEALTH_CLIENT_ID + HealthKit OAuth bridge. Until
 * the secret is provisioned this endpoint returns 503 with the required env
 * vars enumerated. No `.env` writes occur from this code path.
 */
import { NextRequest, NextResponse } from "next/server";

const REQUIRED = ["APPLE_HEALTH_CLIENT_ID"];

export async function GET(_req: NextRequest) {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  return NextResponse.json(
    {
      provider: "apple-health",
      configured: missing.length === 0,
      connected: false,
      required_env: REQUIRED,
      missing,
      disclaimer:
        "Apple Health integration is not provisioned. No live HealthKit data is being consumed.",
      requires_human_review: true,
    },
    { status: missing.length ? 503 : 200 }
  );
}
