/**
 * Fitbit integration — sync stub (apply pass 7 — backlog #4).
 */
import { NextRequest, NextResponse } from "next/server";

const REQUIRED = ["FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET"];

export async function POST(_req: NextRequest) {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  return NextResponse.json(
    {
      provider: "fitbit",
      synced: false,
      records_pulled: 0,
      required_env: REQUIRED,
      missing,
      disclaimer:
        "Fitbit sync is not running. No samples have been ingested by this endpoint.",
      requires_human_review: true,
    },
    { status: 503 }
  );
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      provider: "fitbit",
      last_synced_at: null,
      required_env: REQUIRED,
      missing: REQUIRED.filter((k) => !process.env[k]),
      disclaimer:
        "Fitbit sync status is unavailable until credentials are provisioned.",
      requires_human_review: true,
    },
    { status: 503 }
  );
}
