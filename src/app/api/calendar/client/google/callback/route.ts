import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

// GET /api/calendar/client/google/callback - Handle OAuth callback for clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, baseUrl)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=no_code", baseUrl)
      );
    }

    // Use client-specific callback URL for token exchange
    const clientCallbackUrl = `${baseUrl}/api/calendar/client/google/callback`;

    // Get tokens from Google
    const tokens = await getTokensFromCode(code, clientCallbackUrl);

    // Parse state if provided
    let clientId: string | null = null;
    let redirectUrl: string | null = null;

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString());
        clientId = decoded.clientId;
        redirectUrl = decoded.redirectUrl;
      } catch {
        console.error("Failed to decode state");
      }
    }

    if (!clientId) {
      return NextResponse.redirect(
        new URL("/settings?error=no_client_id", baseUrl)
      );
    }

    // Store tokens for the client
    await prisma.client.update({
      where: { id: clientId },
      data: {
        googleCalendarToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || undefined,
        googleCalendarId: "primary",
      },
    });

    // Redirect back to settings or provided URL
    const finalRedirect = redirectUrl || "/settings?google=connected";

    return NextResponse.redirect(new URL(finalRedirect, baseUrl));
  } catch (error) {
    console.error("Error in Google OAuth callback:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(
      new URL("/settings?error=oauth_failed", baseUrl)
    );
  }
}
