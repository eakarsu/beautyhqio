import { NextRequest } from "next/server";
import { z } from "zod";
import { context, endpoint, fail } from "@/lib/operations/core";
import { decryptCredentials, encryptCredentials } from "@/lib/operations/connections";
import { syncTransaction, refreshToken } from "@/lib/quickbooks";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "MANAGER"] as const;
const QB_PROVIDER = "quickbooks";
const syncSchema = z.object({ transactionId: z.string().trim().min(1).max(191) });

type QBCredentials = {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: string | Date;
};

// Per-business credentials; never read another tenant's connection.
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

// POST /api/quickbooks/sync - Sync one transaction belonging to the caller's business.
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { transactionId } = syncSchema.parse(await request.json());

    const credentials = await getQBCredentials(ctx.businessId);
    if (!credentials) return fail(503, "QuickBooks not connected or token expired");

    // Transaction has no businessId; scope through its location.
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, location: { businessId: ctx.businessId } },
      include: {
        client: true,
        lineItems: {
          include: {
            service: true,
            product: true,
          },
        },
      },
    });

    if (!transaction) return fail(404, "Transaction not found");

    if (transaction.quickbooksInvoiceId) {
      return fail(400, "Transaction already synced to QuickBooks");
    }

    const result = await syncTransaction(credentials.accessToken, credentials.realmId, {
      clientName: transaction.client
        ? `${transaction.client.firstName} ${transaction.client.lastName}`
        : "Walk-in Client",
      clientEmail: transaction.client?.email || undefined,
      clientPhone: transaction.client?.phone || undefined,
      items: transaction.lineItems.map((item) => ({
        name: item.service?.name || item.product?.name || "Item",
        price: Number(item.unitPrice),
        quantity: item.quantity,
      })),
      total: Number(transaction.totalAmount),
      date: transaction.createdAt,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        quickbooksCustomerId: result.customerId,
        quickbooksInvoiceId: result.invoiceId,
        quickbooksPaymentId: result.paymentId,
        quickbooksSyncedAt: new Date(),
      },
    });

    return { success: true, quickbooks: result };
  });
}

// GET /api/quickbooks/sync - Sync all unsynced transactions for the caller's business.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    const credentials = await getQBCredentials(ctx.businessId);
    if (!credentials) return fail(503, "QuickBooks not connected or token expired");

    const createdAt: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      const from = new Date(startDate);
      if (Number.isNaN(from.getTime())) return fail(422, "start must be a valid date");
      createdAt.gte = from;
    }
    if (endDate) {
      const to = new Date(endDate);
      if (Number.isNaN(to.getTime())) return fail(422, "end must be a valid date");
      createdAt.lte = to;
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        location: { businessId: ctx.businessId },
        quickbooksInvoiceId: null,
        status: "COMPLETED",
        ...(startDate || endDate ? { createdAt } : {}),
      },
      include: {
        client: true,
        lineItems: {
          include: {
            service: true,
            product: true,
          },
        },
      },
      take: 50, // Limit batch size
    });

    const results = [];

    for (const transaction of transactions) {
      try {
        const result = await syncTransaction(credentials.accessToken, credentials.realmId, {
          clientName: transaction.client
            ? `${transaction.client.firstName} ${transaction.client.lastName}`
            : "Walk-in Client",
          clientEmail: transaction.client?.email || undefined,
          clientPhone: transaction.client?.phone || undefined,
          items: transaction.lineItems.map((item) => ({
            name: item.service?.name || item.product?.name || "Item",
            price: Number(item.unitPrice),
            quantity: item.quantity,
          })),
          total: Number(transaction.totalAmount),
          date: transaction.createdAt,
        });

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            quickbooksCustomerId: result.customerId,
            quickbooksInvoiceId: result.invoiceId,
            quickbooksPaymentId: result.paymentId,
            quickbooksSyncedAt: new Date(),
          },
        });

        results.push({
          transactionId: transaction.id,
          success: true,
          quickbooks: result,
        });
      } catch (error) {
        results.push({
          transactionId: transaction.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      total: transactions.length,
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  });
}
