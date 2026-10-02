import { NextRequest, NextResponse } from "next/server";
import { context, endpoint } from "@/lib/operations/core";
import { getTokensFromCode } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

// Only follow same-origin relative redirects; the `state` blob is provider-echoed
// and must never become an open redirect.
function safeRedirect(path: string | null, fallback: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

// GET /api/calendar/client/google/callback - Handle client Google OAuth callback.
//
// Provider-initiated redirect, but not an authorization token: `state` is echoed
// back verbatim, so we require the authenticated session and resolve the client
// inside that business. A client user may only connect their own record.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF", "CLIENT"]);
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    if (error) {
      console.error("OAuth error:", error);
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
    // A signed-in client may only connect their own calendar.
    if (ctx.user.clientId && client.id !== ctx.user.clientId) {
      return NextResponse.redirect(new URL("/settings?error=forbidden", baseUrl));
    }

    // Use client-specific callback URL for token exchange
    const clientCallbackUrl = `${baseUrl}/api/calendar/client/google/callback`;
    const tokens = await getTokensFromCode(code, clientCallbackUrl);

    await prisma.client.update({
      where: { id: client.id },
      data: {
        googleCalendarToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || undefined,
        googleCalendarId: "primary",
      },
    });

    const finalRedirect = safeRedirect(redirectUrl, "/settings?google=connected");
    return NextResponse.redirect(new URL(finalRedirect, baseUrl));
  });
}
