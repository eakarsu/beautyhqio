import { NextRequest, NextResponse } from "next/server";
import { getOutlookTokensFromCode, getOutlookUserProfile } from "@/lib/outlook-calendar";
import { prisma } from "@/lib/prisma";

// GET /api/calendar/client/outlook/callback - Handle OAuth callback for clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    if (error) {
      console.error("OAuth error:", error, errorDescription);
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
    const clientCallbackUrl = `${baseUrl}/api/calendar/client/outlook/callback`;

    // Get tokens from Microsoft
    const tokens = await getOutlookTokensFromCode(code, clientCallbackUrl);

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

    // Get user profile for display name/email
    let userEmail: string | null = null;
    try {
      const profile = await getOutlookUserProfile(tokens.accessToken);
      userEmail = profile?.mail || profile?.userPrincipalName || null;
    } catch (e) {
      console.error("Failed to get user profile:", e);
    }

    // Store tokens for the client
    await prisma.client.update({
      where: { id: clientId },
      data: {
        outlookCalendarToken: tokens.accessToken,
        outlookRefreshToken: tokens.refreshToken || undefined,
        outlookCalendarId: "primary",
        outlookTokenExpiry: tokens.expiresAt,
      },
    });

    // Redirect back to settings or provided URL
    const successParam = userEmail
      ? `outlook=connected&email=${encodeURIComponent(userEmail)}`
      : "outlook=connected";
    const finalRedirect = redirectUrl || `/settings?${successParam}`;

    return NextResponse.redirect(new URL(finalRedirect, baseUrl));
  } catch (error) {
    console.error("Error in Outlook OAuth callback:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(
      new URL("/settings?error=oauth_failed", baseUrl)
    );
  }
}
