import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// GET /api/business/leads - List marketplace leads
export async function GET(request: NextRequest) {
  try {
    let user = null;

    // First try web session (NextAuth)
    const session = await getServerSession(authOptions);
    if (session?.user) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { business: true },
      });
    }

    // If no web session, try mobile JWT token
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; businessId: string };
          user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { business: true },
          });
        } catch {
          // Invalid token, continue to unauthorized
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      businessId: user.business.id,
    };

    if (status) {
      where.status = status;
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    const [leads, total] = await Promise.all([
      prisma.marketplaceLead.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          appointment: {
            select: {
              id: true,
              scheduledStart: true,
              status: true,
              services: {
                include: {
                  service: {
                    select: { name: true, price: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.marketplaceLead.count({ where }),
    ]);

    return NextResponse.json({
      leads: leads.map((lead) => ({
        ...lead,
        commissionRate: lead.commissionRate ? Number(lead.commissionRate) : null,
        commissionAmount: lead.commissionAmount ? Number(lead.commissionAmount) : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
