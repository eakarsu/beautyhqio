import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

// GET /api/calendar/auth - Get Google OAuth URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const redirectUrl = searchParams.get("redirect");

    // Create state to pass through OAuth flow
    const state = JSON.stringify({ staffId, redirectUrl });
    const encodedState = Buffer.from(state).toString("base64");

    const authUrl = getAuthUrl(encodedState);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
