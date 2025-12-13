import { NextRequest, NextResponse } from "next/server";
import { syncTransaction, refreshToken } from "@/lib/quickbooks";
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
    // Refresh token
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

// POST /api/quickbooks/sync - Sync a transaction to QuickBooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }

    // Get QuickBooks credentials
    const credentials = await getQBCredentials();
    if (!credentials) {
      return NextResponse.json(
        { error: "QuickBooks not connected or token expired" },
        { status: 401 }
      );
    }

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
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

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if already synced
    if (transaction.quickbooksInvoiceId) {
      return NextResponse.json(
        { error: "Transaction already synced to QuickBooks" },
        { status: 400 }
      );
    }

    // Sync to QuickBooks
    const result = await syncTransaction(
      credentials.accessToken,
      credentials.realmId,
      {
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
      }
    );

    // Update transaction with QuickBooks IDs
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        quickbooksCustomerId: result.customerId,
        quickbooksInvoiceId: result.invoiceId,
        quickbooksPaymentId: result.paymentId,
        quickbooksSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      quickbooks: result,
    });
  } catch (error) {
    console.error("Error syncing to QuickBooks:", error);
    return NextResponse.json(
      { error: "Failed to sync to QuickBooks" },
      { status: 500 }
    );
  }
}

// GET /api/quickbooks/sync - Sync all unsynced transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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

    // Find unsynced transactions
    const whereClause: Record<string, unknown> = {
      quickbooksInvoiceId: null,
      status: "COMPLETED",
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        (whereClause.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (whereClause.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
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
        const result = await syncTransaction(
          credentials.accessToken,
          credentials.realmId,
          {
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
          }
        );

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

    return NextResponse.json({
      total: transactions.length,
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Error bulk syncing to QuickBooks:", error);
    return NextResponse.json(
      { error: "Failed to bulk sync to QuickBooks" },
      { status: 500 }
    );
  }
}
