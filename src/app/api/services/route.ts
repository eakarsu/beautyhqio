import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/services - List services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const categoryId = searchParams.get("categoryId");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (businessId) where.businessId = businessId;
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

    // Get businessId from body or find the first business
    let finalBusinessId = businessId;
    if (!finalBusinessId) {
      const firstBusiness = await prisma.business.findFirst();
      if (!firstBusiness) {
        return NextResponse.json(
          { error: "No business found. Please create a business first." },
          { status: 400 }
        );
      }
      finalBusinessId = firstBusiness.id;
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
