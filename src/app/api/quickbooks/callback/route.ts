import { NextRequest, NextResponse } from "next/server";
import { context, endpoint } from "@/lib/operations/core";
import { encryptCredentials } from "@/lib/operations/connections";
import { getTokensFromCode } from "@/lib/quickbooks";
import { prisma } from "@/lib/prisma";

const QB_PROVIDER = "quickbooks";

// GET /api/quickbooks/callback - Handle the QuickBooks OAuth callback.
//
// Provider-initiated: the echoed `state` must match the value our auth route
// issued. We never read a business id from the query string — the connection is
// always written to the authenticated caller's business. (TODO(security): the
// shared state is a constant today; sign it per-session so a stolen callback
// cannot be replayed into another session.)
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const realmId = searchParams.get("realmId");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?qb_error=${encodeURIComponent(error)}`, baseUrl)
      );
    }

    if (!code || !realmId) {
      return NextResponse.redirect(new URL("/settings?qb_error=missing_params", baseUrl));
    }

    const expectedState = process.env.QUICKBOOKS_OAUTH_STATE || "beauty-wellness-state";
    if (state !== expectedState) {
      return NextResponse.redirect(new URL("/settings?qb_error=invalid_state", baseUrl));
    }

    // Get tokens from QuickBooks
    const tokens = await getTokensFromCode(code, realmId);

    const encryptedCredentials = encryptCredentials(ctx.businessId, QB_PROVIDER, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      realmId: tokens.realmId,
      expiresAt: tokens.expiresAt,
    });

    await prisma.integrationConnection.upsert({
      where: { businessId_provider: { businessId: ctx.businessId, provider: QB_PROVIDER } },
      create: {
        businessId: ctx.businessId,
        provider: QB_PROVIDER,
        encryptedCredentials,
        configuration: {},
        status: "CONNECTED",
      },
      update: { encryptedCredentials, status: "CONNECTED" },
    });

    return NextResponse.redirect(new URL("/settings?quickbooks=connected", baseUrl));
  });
}
