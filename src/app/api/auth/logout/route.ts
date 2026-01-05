import { NextResponse } from "next/server";

// POST /api/auth/logout - Logout (just returns success, token invalidation handled client-side)
export async function POST() {
  return NextResponse.json({ message: "Logged out successfully" });
}
