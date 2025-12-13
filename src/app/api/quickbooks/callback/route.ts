import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/quickbooks";
import { prisma } from "@/lib/prisma";

// GET /api/quickbooks/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const realmId = searchParams.get("realmId");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?qb_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !realmId) {
      return NextResponse.redirect(
        new URL("/settings?qb_error=missing_params", request.url)
      );
    }

    // Get tokens from QuickBooks
    const tokens = await getTokensFromCode(code, realmId);

    // Store tokens in settings
    await prisma.settings.upsert({
      where: { id: "default" },
      update: {
        quickbooksAccessToken: tokens.accessToken,
        quickbooksRefreshToken: tokens.refreshToken,
        quickbooksRealmId: tokens.realmId,
        quickbooksTokenExpiry: tokens.expiresAt,
      },
      create: {
        id: "default",
        quickbooksAccessToken: tokens.accessToken,
        quickbooksRefreshToken: tokens.refreshToken,
        quickbooksRealmId: tokens.realmId,
        quickbooksTokenExpiry: tokens.expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL("/settings?quickbooks=connected", request.url)
    );
  } catch (error) {
    console.error("Error in QuickBooks callback:", error);
    return NextResponse.redirect(
      new URL("/settings?qb_error=oauth_failed", request.url)
    );
  }
}
