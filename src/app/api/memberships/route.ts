import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/memberships - List all membership plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";

    const memberships = await prisma.membership.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(
      memberships.map((m) => ({
        ...m,
        price: Number(m.price),
        discountPercent: Number(m.discountPercent),
        subscriberCount: m._count.subscriptions,
      }))
    );
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return NextResponse.json(
      { error: "Failed to fetch memberships" },
      { status: 500 }
    );
  }
}

// POST /api/memberships - Create a new membership plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      name,
      description,
      price,
      billingCycle = "monthly",
      discountPercent = 0,
      freeServicesPerMonth = 0,
      priorityBooking = false,
      guestPasses = 0,
      includedServices,
      image,
      color,
      isPopular = false,
    } = body;

    if (!businessId || !name || !price) {
      return NextResponse.json(
        { error: "businessId, name, and price are required" },
        { status: 400 }
      );
    }

    const membership = await prisma.membership.create({
      data: {
        businessId,
        name,
        description,
        price,
        billingCycle,
        discountPercent,
        freeServicesPerMonth,
        priorityBooking,
        guestPasses,
        includedServices,
        image,
        color,
        isPopular,
      },
    });

    return NextResponse.json(
      {
        ...membership,
        price: Number(membership.price),
        discountPercent: Number(membership.discountPercent),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating membership:", error);
    return NextResponse.json(
      { error: "Failed to create membership" },
      { status: 500 }
    );
  }
}
