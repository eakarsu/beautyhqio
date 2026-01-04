import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InvoiceStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// Helper to get user from either web session or mobile JWT
async function getAuthenticatedUser(request: NextRequest) {
  // First try web session (NextAuth)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });
    return user;
  }

  // If no web session, try mobile JWT token
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; businessId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { business: true },
      });
      return user;
    } catch {
      return null;
    }
  }

  return null;
}

// GET /api/business/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
