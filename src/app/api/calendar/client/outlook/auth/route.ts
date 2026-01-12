import { NextRequest, NextResponse } from "next/server";
import { getOutlookAuthUrl } from "@/lib/outlook-calendar";

// GET /api/calendar/client/outlook/auth - Get Outlook OAuth URL for clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const redirectUrl = searchParams.get("redirect");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    // Create state to pass through OAuth flow
    const state = JSON.stringify({ clientId, redirectUrl, provider: "outlook", userType: "client" });
    const encodedState = Buffer.from(state).toString("base64");

    // Use client-specific callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const clientCallbackUrl = `${baseUrl}/api/calendar/client/outlook/callback`;

    const authUrl = getOutlookAuthUrl(encodedState, clientCallbackUrl);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error generating Outlook auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
