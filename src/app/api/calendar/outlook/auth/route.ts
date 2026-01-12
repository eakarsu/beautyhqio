import { NextRequest, NextResponse } from "next/server";
import { getOutlookAuthUrl } from "@/lib/outlook-calendar";

// GET /api/calendar/outlook/auth - Get Outlook OAuth URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const redirectUrl = searchParams.get("redirect");

    if (!staffId) {
      return NextResponse.json(
        { error: "staffId is required" },
        { status: 400 }
      );
    }

    // Create state to pass through OAuth flow
    const state = JSON.stringify({ staffId, redirectUrl, provider: "outlook" });
    const encodedState = Buffer.from(state).toString("base64");

    const authUrl = getOutlookAuthUrl(encodedState);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error generating Outlook auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
