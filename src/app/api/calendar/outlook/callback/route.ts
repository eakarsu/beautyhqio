import { NextRequest, NextResponse } from "next/server";
import { getOutlookTokensFromCode, getOutlookUserProfile } from "@/lib/outlook-calendar";
import { prisma } from "@/lib/prisma";

// GET /api/calendar/outlook/callback - Handle OAuth callback
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

    // Get tokens from Microsoft
    const tokens = await getOutlookTokensFromCode(code);

    // Parse state if provided
    let staffId: string | null = null;
    let redirectUrl: string | null = null;

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString());
        staffId = decoded.staffId;
        redirectUrl = decoded.redirectUrl;
      } catch {
        console.error("Failed to decode state");
      }
    }

    if (!staffId) {
      return NextResponse.redirect(
        new URL("/settings?error=no_staff_id", baseUrl)
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

    // Store tokens for the staff member
    await prisma.staff.update({
      where: { id: staffId },
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
