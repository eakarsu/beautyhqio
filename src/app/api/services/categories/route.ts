import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/services/categories - List service categories
export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/services/categories - Create service category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, sortOrder, businessId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Get businessId from body or use first business
    let finalBusinessId = businessId;
    if (!finalBusinessId) {
      const business = await prisma.business.findFirst();
      finalBusinessId = business?.id;
    }

    if (!finalBusinessId) {
      return NextResponse.json(
        { error: "No business found" },
        { status: 400 }
      );
    }

    const category = await prisma.serviceCategory.create({
      data: {
        name,
        description,
        color,
        sortOrder: sortOrder || 0,
        businessId: finalBusinessId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
