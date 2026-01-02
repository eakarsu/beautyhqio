import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/salons/[id] - Get salon details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isPlatformAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        subscription: true,
        locations: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        clients: {
          select: { id: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // Get appointment count
    const appointmentCount = await prisma.appointment.count({
      where: {
        location: {
          businessId: id,
        },
      },
    });

    // Get total revenue from transactions
    const transactions = await prisma.transaction.aggregate({
      where: {
        location: {
          businessId: id,
        },
        status: "COMPLETED",
      },
      _sum: {
        totalAmount: true,
      },
    });

    return NextResponse.json({
      id: business.id,
      name: business.name,
      type: business.type,
      phone: business.phone,
      email: business.email,
      website: business.website,
      address: business.address,
      city: business.city,
      state: business.state,
      createdAt: business.createdAt.toISOString(),
      subscription: business.subscription
        ? {
            plan: business.subscription.plan,
            status: business.subscription.status,
            monthlyPrice: Number(business.subscription.monthlyPrice),
            commissionRate: Number(business.subscription.marketplaceCommissionPct),
            currentPeriodEnd: business.subscription.currentPeriodEnd?.toISOString() || null,
          }
        : null,
      stats: {
        totalUsers: business.users.length,
        totalClients: business.clients.length,
        totalAppointments: appointmentCount,
        totalRevenue: Number(transactions._sum.totalAmount || 0),
      },
      locations: business.locations,
      users: business.users,
    });
  } catch (error) {
    console.error("Error fetching salon details:", error);
    return NextResponse.json(
      { error: "Failed to fetch salon details" },
      { status: 500 }
    );
  }
}
