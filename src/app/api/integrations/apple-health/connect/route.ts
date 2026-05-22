/**
 * Apple Health integration — OAuth connect stub (apply pass 7 — backlog #4).
 * NEEDS-CREDS: returns 503 until APPLE_HEALTH_CLIENT_ID is provisioned.
 */
import { NextRequest, NextResponse } from "next/server";

const REQUIRED = ["APPLE_HEALTH_CLIENT_ID"];

export async function POST(_req: NextRequest) {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  return NextResponse.json(
    {
      provider: "apple-health",
      connected: false,
      authorization_url: null,
      required_env: REQUIRED,
      missing,
      disclaimer:
        "Apple Health OAuth bridge is not provisioned. This endpoint is a 503 stub until credentials are configured.",
      requires_human_review: true,
    },
    { status: 503 }
  );
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      provider: "apple-health",
      method_allowed: "POST",
      required_env: REQUIRED,
      missing: REQUIRED.filter((k) => !process.env[k]),
      disclaimer:
        "Use POST to initiate Apple Health connect. Currently disabled (NEEDS-CREDS).",
      requires_human_review: true,
    },
    { status: 503 }
  );
}
