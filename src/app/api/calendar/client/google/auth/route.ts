import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

// GET /api/calendar/client/google/auth - Get Google OAuth URL for clients
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
    const state = JSON.stringify({ clientId, redirectUrl, provider: "google", userType: "client" });
    const encodedState = Buffer.from(state).toString("base64");

    // Use client-specific callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const clientCallbackUrl = `${baseUrl}/api/calendar/client/google/callback`;

    const authUrl = getAuthUrl(encodedState, clientCallbackUrl);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error generating Google auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
