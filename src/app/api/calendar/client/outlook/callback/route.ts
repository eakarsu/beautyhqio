import { NextRequest, NextResponse } from "next/server";
import { context, endpoint } from "@/lib/operations/core";
import { getOutlookTokensFromCode, getOutlookUserProfile } from "@/lib/outlook-calendar";
import { prisma } from "@/lib/prisma";

// Only follow same-origin relative redirects; the `state` blob is provider-echoed
// and must never become an open redirect.
function safeRedirect(path: string | null, fallback: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

// GET /api/calendar/client/outlook/callback - Handle client Outlook OAuth callback.
//
// Provider-initiated redirect with an echoed `state`; the caller's session is the
// authority. The referenced client must belong to the session's business.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF", "CLIENT"]);
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, baseUrl)
      );
    }

    if (!code) {
      return NextResponse.redirect(new URL("/settings?error=no_code", baseUrl));
    }

    let clientId: string | null = null;
    let redirectUrl: string | null = null;

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString());
        if (typeof decoded.clientId === "string" && decoded.clientId) clientId = decoded.clientId;
        if (typeof decoded.redirectUrl === "string") redirectUrl = decoded.redirectUrl;
      } catch {
        return NextResponse.redirect(new URL("/settings?error=invalid_state", baseUrl));
      }
    }

    if (!clientId) {
      return NextResponse.redirect(new URL("/settings?error=no_client_id", baseUrl));
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.redirect(new URL("/settings?error=client_not_found", baseUrl));
    }
    if (ctx.user.clientId && client.id !== ctx.user.clientId) {
      return NextResponse.redirect(new URL("/settings?error=forbidden", baseUrl));
    }

    // Use client-specific callback URL for token exchange
    const clientCallbackUrl = `${baseUrl}/api/calendar/client/outlook/callback`;
    const tokens = await getOutlookTokensFromCode(code, clientCallbackUrl);

    // Get user profile for display name/email
    let userEmail: string | null = null;
    try {
      const profile = await getOutlookUserProfile(tokens.accessToken);
      userEmail = profile?.mail || profile?.userPrincipalName || null;
    } catch (e) {
      console.error("Failed to get user profile:", e);
    }

    await prisma.client.update({
      where: { id: client.id },
      data: {
        outlookCalendarToken: tokens.accessToken,
        outlookRefreshToken: tokens.refreshToken || undefined,
        outlookCalendarId: "primary",
        outlookTokenExpiry: tokens.expiresAt,
      },
    });

    const successParam = userEmail
      ? `outlook=connected&email=${encodeURIComponent(userEmail)}`
      : "outlook=connected";
    const finalRedirect = safeRedirect(redirectUrl, `/settings?${successParam}`);

    return NextResponse.redirect(new URL(finalRedirect, baseUrl));
  });
}
