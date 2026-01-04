import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

// GET /api/transactions - List transactions
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const locationId = searchParams.get("locationId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.date as Record<string, unknown>).lte = end;
      }
    }

    // Apply business filter - filter transactions by their location's businessId
    if (!user.isPlatformAdmin && user.businessId) {
      const locations = await prisma.location.findMany({
        where: { businessId: user.businessId },
        select: { id: true },
      });
      const locationIds = locations.map((l) => l.id);
      if (locationIds.length > 0) {
        where.locationId = locationId ? locationId : { in: locationIds };
      }
    } else if (locationId) {
      where.locationId = locationId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      take: limit,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        staff: {
          select: {
            displayName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payments: {
          select: {
            method: true,
            amount: true,
          },
        },
        lineItems: {
          select: {
            type: true,
            name: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Format transactions for report
    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      transactionNumber: tx.transactionNumber,
      date: tx.date,
      createdAt: tx.createdAt,
      clientName: tx.client ? `${tx.client.firstName} ${tx.client.lastName}` : "Walk-in",
      staffName: tx.staff?.displayName ||
        (tx.staff?.user ? `${tx.staff.user.firstName} ${tx.staff.user.lastName}` : "-"),
      subtotal: tx.subtotal,
      taxAmount: tx.taxAmount,
      tipAmount: tx.tipAmount || 0,
      discountAmount: tx.discountAmount || 0,
      totalAmount: tx.totalAmount,
      paymentMethod: tx.payments[0]?.method || "-",
      status: tx.status,
      type: tx.type,
      lineItems: tx.lineItems,
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
