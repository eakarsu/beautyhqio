import { NextResponse } from "next/server";

// The former endpoint trusted arbitrary provider IDs and assigned new callers
// to the first tenant. Mobile OAuth must now use the verified NextAuth provider
// flow; accepting an unverified social assertion is intentionally unsupported.
export async function POST() {
  return NextResponse.json(
    { error: "UNVERIFIED_SOCIAL_LOGIN_REMOVED", message: "Use the provider authorization-code flow at /api/auth/signin." },
    { status: 410 },
  );
}
