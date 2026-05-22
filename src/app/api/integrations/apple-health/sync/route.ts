/**
 * Apple Health integration — sync stub (apply pass 7 — backlog #4).
 * NEEDS-CREDS: returns 503 until APPLE_HEALTH_CLIENT_ID is provisioned.
 */
import { NextRequest, NextResponse } from "next/server";

const REQUIRED = ["APPLE_HEALTH_CLIENT_ID"];

export async function POST(_req: NextRequest) {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  return NextResponse.json(
    {
      provider: "apple-health",
      synced: false,
      records_pulled: 0,
      required_env: REQUIRED,
      missing,
      disclaimer:
        "Apple Health sync is not running. No HealthKit samples have been ingested by this endpoint.",
      requires_human_review: true,
    },
    { status: 503 }
  );
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      provider: "apple-health",
      last_synced_at: null,
      required_env: REQUIRED,
      missing: REQUIRED.filter((k) => !process.env[k]),
      disclaimer:
        "Apple Health sync status is unavailable until credentials are provisioned.",
      requires_human_review: true,
    },
    { status: 503 }
  );
}
