import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, getBusinessIdFilter, AuthenticatedUser } from "@/lib/api-auth";

// GET /api/services - List services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedBusinessId = searchParams.get("businessId");
    const locationId = searchParams.get("locationId");
    const categoryId = searchParams.get("categoryId");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};

    // If locationId is provided (public booking flow), get businessId from location
    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
        select: { businessId: true },
      });
      if (location) {
        where.businessId = location.businessId;
      }
    } else {
      // Authenticate user for non-public access
      const user = await getAuthenticatedUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Apply business filter
      const businessIdFilter = getBusinessIdFilter(user as AuthenticatedUser, requestedBusinessId);
      if (businessIdFilter) {
        where.businessId = businessIdFilter;
      }
    }

    if (categoryId) where.categoryId = categoryId;
    if (isActive !== null) where.isActive = isActive === "true";

    const services = await prisma.service.findMany({
      where,
      include: {
        category: true,
        addOns: true,
      },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create service
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER, MANAGER, or PLATFORM_ADMIN can create services
    if (!user.isPlatformAdmin && !["OWNER", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden - insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      businessId,
      categoryId,
      name,
      description,
      duration,
      price,
      priceType,
      color,
      allowOnline,
    } = body;

    // Determine target business
    let finalBusinessId = user.isPlatformAdmin ? (businessId || user.businessId) : user.businessId;
    if (!finalBusinessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        businessId: finalBusinessId,
        categoryId: categoryId || null,
        name,
        description,
        duration,
        price,
        priceType,
        color,
        allowOnline,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    console.error("Error creating service:", error);

    // Handle unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A service with this name already exists. Please use a different name." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
