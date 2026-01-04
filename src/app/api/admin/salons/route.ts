import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

// GET /api/admin/salons - List all salons
export async function GET() {
  try {
    const authResult = await requireRoles(["PLATFORM_ADMIN"]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const salons = await prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
            monthlyPrice: true,
          },
        },
        _count: {
          select: {
            users: true,
            clients: true,
            locations: true,
          },
        },
      },
    });

    return NextResponse.json({
      salons: salons.map((salon) => ({
        id: salon.id,
        name: salon.name,
        type: salon.type,
        email: salon.email,
        phone: salon.phone,
        city: salon.city,
        state: salon.state,
        createdAt: salon.createdAt.toISOString(),
        subscription: salon.subscription,
        _count: salon._count,
      })),
    });
  } catch (error) {
    console.error("Error fetching salons:", error);
    return NextResponse.json(
      { error: "Failed to fetch salons" },
      { status: 500 }
    );
  }
}
