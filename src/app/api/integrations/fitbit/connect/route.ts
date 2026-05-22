/**
 * Fitbit integration — OAuth connect stub (apply pass 7 — backlog #4).
 */
import { NextRequest, NextResponse } from "next/server";

const REQUIRED = ["FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET"];

export async function POST(_req: NextRequest) {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  return NextResponse.json(
    {
      provider: "fitbit",
      connected: false,
      authorization_url: null,
      required_env: REQUIRED,
      missing,
      disclaimer:
        "Fitbit OAuth bridge is not provisioned. This endpoint is a 503 stub until credentials are configured.",
      requires_human_review: true,
    },
    { status: 503 }
  );
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      provider: "fitbit",
      method_allowed: "POST",
      required_env: REQUIRED,
      missing: REQUIRED.filter((k) => !process.env[k]),
      disclaimer:
        "Use POST to initiate Fitbit connect. Currently disabled (NEEDS-CREDS).",
      requires_human_review: true,
    },
    { status: 503 }
  );
}
