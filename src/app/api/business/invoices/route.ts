import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InvoiceStatus } from "@prisma/client";

// GET /api/business/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });

    if (!user?.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId: user.business.id },
    });

    if (!subscription) {
      return NextResponse.json({ invoices: [], total: 0 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const where = {
      subscriptionId: subscription.id,
      ...(status && { status: status as InvoiceStatus }),
    };

    const [invoices, total] = await Promise.all([
      prisma.businessInvoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.businessInvoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        ...inv,
        subscriptionAmount: Number(inv.subscriptionAmount),
        commissionAmount: Number(inv.commissionAmount),
        totalAmount: Number(inv.totalAmount),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
