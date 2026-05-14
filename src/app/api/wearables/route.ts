/**
 * Wearable integrations (apply pass 5).
 *
 * Env vars (NEEDS-CREDS):
 *  - APPLE_HEALTH_CLIENT_ID, APPLE_HEALTH_TEAM_ID, APPLE_HEALTH_KEY_ID, APPLE_HEALTH_PRIVATE_KEY
 *  - FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET
 *
 * If creds missing, returns 503 with `{ error, missing: <ENV> }`.
 *
 * Note: HealthKit is not a server-side API; APPLE_HEALTH_* here represents the
 * iOS Sign-In + JWT bridge required for a server to validate device-pushed metrics.
 */
import { NextRequest, NextResponse } from "next/server";

function gateOnEnv(vars: string[]) {
  for (const v of vars) {
    if (!process.env[v]) return v;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = (searchParams.get("provider") || "fitbit").toLowerCase();
  let needed: string[];
  if (provider === "apple-health" || provider === "apple") {
    needed = ["APPLE_HEALTH_CLIENT_ID", "APPLE_HEALTH_TEAM_ID", "APPLE_HEALTH_KEY_ID", "APPLE_HEALTH_PRIVATE_KEY"];
  } else if (provider === "fitbit") {
    needed = ["FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET"];
  } else {
    return NextResponse.json({ error: "Unknown provider", supported: ["apple-health", "fitbit"] }, { status: 400 });
  }
  const missing = gateOnEnv(needed);
  if (missing) return NextResponse.json({ error: "Wearable provider not configured", missing }, { status: 503 });

  return NextResponse.json({
    provider,
    connect_url: null,
    note: "Stub — provider OAuth not initiated; creds present.",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const provider = (body?.provider || "fitbit").toLowerCase();
  const needed = provider === "fitbit"
    ? ["FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET"]
    : ["APPLE_HEALTH_CLIENT_ID", "APPLE_HEALTH_TEAM_ID", "APPLE_HEALTH_KEY_ID", "APPLE_HEALTH_PRIVATE_KEY"];
  const missing = gateOnEnv(needed);
  if (missing) return NextResponse.json({ error: "Wearable provider not configured", missing }, { status: 503 });

  return NextResponse.json({
    success: true,
    provider,
    metrics_ingested: 0,
    note: "Stub — no metrics actually ingested; creds present.",
  });
}
