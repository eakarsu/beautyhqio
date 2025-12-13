import { NextRequest, NextResponse } from "next/server";
import {
  getProfitAndLossReport,
  getBalanceSheetReport,
  refreshToken,
} from "@/lib/quickbooks";
import { prisma } from "@/lib/prisma";

// Helper to get valid QuickBooks credentials
async function getQBCredentials() {
  const settings = await prisma.settings.findFirst({
    where: { id: "default" },
  });

  if (!settings?.quickbooksAccessToken || !settings?.quickbooksRealmId) {
    return null;
  }

  // Check if token is expired
  if (
    settings.quickbooksTokenExpiry &&
    new Date(settings.quickbooksTokenExpiry) < new Date()
  ) {
    if (settings.quickbooksRefreshToken) {
      try {
        const newTokens = await refreshToken(settings.quickbooksRefreshToken);

        await prisma.settings.update({
          where: { id: "default" },
          data: {
            quickbooksAccessToken: newTokens.accessToken,
            quickbooksRefreshToken: newTokens.refreshToken,
            quickbooksTokenExpiry: newTokens.expiresAt,
          },
        });

        return {
          accessToken: newTokens.accessToken,
          realmId: settings.quickbooksRealmId,
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  return {
    accessToken: settings.quickbooksAccessToken,
    realmId: settings.quickbooksRealmId,
  };
}

// GET /api/quickbooks/reports - Get QuickBooks reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "profit-loss";
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    // Get QuickBooks credentials
    const credentials = await getQBCredentials();
    if (!credentials) {
      return NextResponse.json(
        { error: "QuickBooks not connected or token expired" },
        { status: 401 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    let report;

    switch (reportType) {
      case "profit-loss":
        report = await getProfitAndLossReport(
          credentials.accessToken,
          credentials.realmId,
          start,
          end
        );
        break;

      case "balance-sheet":
        report = await getBalanceSheetReport(
          credentials.accessToken,
          credentials.realmId,
          end
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid report type. Use: profit-loss, balance-sheet" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      reportType,
      dateRange: {
        start: start.toDateString(),
        end: end.toDateString(),
      },
      report,
    });
  } catch (error) {
    console.error("Error fetching QuickBooks report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report from QuickBooks" },
      { status: 500 }
    );
  }
}
