import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

// GET /api/calendar/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=no_code", request.url)
      );
    }

    // Get tokens from Google
    const tokens = await getTokensFromCode(code);

    // Parse state if provided
    let staffId: string | null = null;
    let redirectUrl: string | null = null;

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString());
        staffId = decoded.staffId;
        redirectUrl = decoded.redirectUrl;
      } catch {
        // Ignore state parsing errors
      }
    }

    // Store tokens for the staff member
    if (staffId && tokens.access_token) {
      await prisma.staff.update({
        where: { id: staffId },
        data: {
          googleCalendarToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || undefined,
          googleCalendarId: "primary", // Default to primary calendar
        },
      });
    }

    // Redirect back to settings or provided URL
    const finalRedirect = redirectUrl || "/settings?google=connected";
    return NextResponse.redirect(new URL(finalRedirect, request.url));
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/settings?error=oauth_failed", request.url)
    );
  }
}
