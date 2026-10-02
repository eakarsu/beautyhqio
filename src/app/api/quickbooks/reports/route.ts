import { NextRequest } from "next/server";
import { context, endpoint, fail } from "@/lib/operations/core";
import { decryptCredentials, encryptCredentials } from "@/lib/operations/connections";
import {
  getProfitAndLossReport,
  getBalanceSheetReport,
  refreshToken,
} from "@/lib/quickbooks";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "MANAGER"] as const;
const QB_PROVIDER = "quickbooks";

type QBCredentials = {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: string | Date;
};

// Read the QuickBooks connection for the caller's business only. The legacy
// singleton `Settings` row has no tenant column, so credentials now live in the
// per-business IntegrationConnection record.
async function getQBCredentials(businessId: string): Promise<QBCredentials | null> {
  const row = await prisma.integrationConnection.findUnique({
    where: { businessId_provider: { businessId, provider: QB_PROVIDER } },
  });
  if (!row || row.status === "DISCONNECTED") return null;

  let credentials: QBCredentials;
  try {
    credentials = decryptCredentials(businessId, QB_PROVIDER, row.encryptedCredentials) as QBCredentials;
  } catch {
    return null;
  }
  if (!credentials?.accessToken || !credentials?.realmId) return null;

  const expiresAt = credentials.expiresAt ? new Date(credentials.expiresAt) : null;
  if (expiresAt && expiresAt < new Date()) {
    if (!credentials.refreshToken) return null;
    try {
      const tokens = await refreshToken(credentials.refreshToken);
      const next: QBCredentials = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        realmId: credentials.realmId,
        expiresAt: tokens.expiresAt,
      };
      await prisma.integrationConnection.update({
        where: { id: row.id },
        data: { encryptedCredentials: encryptCredentials(businessId, QB_PROVIDER, next) },
      });
      return next;
    } catch {
      return null;
    }
  }

  return credentials;
}

// GET /api/quickbooks/reports - Get QuickBooks reports for the caller's business.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "profit-loss";
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    if (!["profit-loss", "balance-sheet"].includes(reportType)) {
      return fail(400, "Invalid report type. Use: profit-loss, balance-sheet");
    }

    const credentials = await getQBCredentials(ctx.businessId);
    if (!credentials) {
      return fail(503, "QuickBooks not connected or token expired");
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return fail(422, "start and end must be valid dates");
    }

    const report = reportType === "profit-loss"
      ? await getProfitAndLossReport(credentials.accessToken, credentials.realmId, start, end)
      : await getBalanceSheetReport(credentials.accessToken, credentials.realmId, end);

    return {
      reportType,
      dateRange: {
        start: start.toDateString(),
        end: end.toDateString(),
      },
      report,
    };
  });
}
