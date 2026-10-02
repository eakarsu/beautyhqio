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

// GET /api/calendar/callback - Handle (staff) Google OAuth callback.
//
// The provider echoes whatever `state` it was given, so `state` is NOT an
// authorization token. We require an authenticated session for the consenting
// browser and resolve the staff member inside that session's business; a
// caller-supplied/forged staff id from another tenant is rejected.
//
// TODO(security): /api/calendar/auth currently builds `state` as unsigned
// base64. Sign it (HMAC with a server secret) there to fully close login-CSRF;
// until then the session + tenant binding below is the enforcement point.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, baseUrl)
      );
    }

    if (!code) {
      return NextResponse.redirect(new URL("/settings?error=no_code", baseUrl));
    }

    let staffId: string | null = null;
    let redirectUrl: string | null = null;

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString());
        if (typeof decoded.staffId === "string" && decoded.staffId) staffId = decoded.staffId;
        if (typeof decoded.redirectUrl === "string") redirectUrl = decoded.redirectUrl;
      } catch {
        return NextResponse.redirect(new URL("/settings?error=invalid_state", baseUrl));
      }
    }

    if (!staffId) {
      return NextResponse.redirect(new URL("/settings?error=no_staff_id", baseUrl));
    }

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, location: { businessId: ctx.businessId } },
      select: { id: true },
    });
    if (!staff) {
      return NextResponse.redirect(new URL("/settings?error=staff_not_found", baseUrl));
    }
    // A staff-role user may only connect their own calendar.
    if (ctx.user.staffId && staff.id !== ctx.user.staffId) {
      return NextResponse.redirect(new URL("/settings?error=forbidden", baseUrl));
    }

    const tokens = await getTokensFromCode(code);

    if (tokens.access_token) {
      await prisma.staff.update({
        where: { id: staff.id },
        data: {
          googleCalendarToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || undefined,
          googleCalendarId: "primary", // Default to primary calendar
        },
      });
    }

    const finalRedirect = safeRedirect(redirectUrl, "/settings?google=connected");
    return NextResponse.redirect(new URL(finalRedirect, baseUrl));
  });
}
