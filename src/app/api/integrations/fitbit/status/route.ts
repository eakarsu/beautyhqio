/**
 * Fitbit integration — status stub (apply pass 7 — backlog #4).
 * NEEDS-CREDS: requires FITBIT_CLIENT_ID + FITBIT_CLIENT_SECRET OAuth pair.
 */
import { NextRequest, NextResponse } from "next/server";

const REQUIRED = ["FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET"];

export async function GET(_req: NextRequest) {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  return NextResponse.json(
    {
      provider: "fitbit",
      configured: missing.length === 0,
      connected: false,
      required_env: REQUIRED,
      missing,
      disclaimer:
        "Fitbit integration is not provisioned. No Fitbit data is being consumed.",
      requires_human_review: true,
    },
    { status: missing.length ? 503 : 200 }
  );
}
