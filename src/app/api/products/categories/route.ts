import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products/categories - List product categories
export async function GET() {
  try {
    const categories = await prisma.productCategory.findMany({
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

// POST /api/products/categories - Create product category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Get the first business (for single-tenant apps) or use provided businessId
    let businessId = body.businessId;
    if (!businessId) {
      const business = await prisma.business.findFirst();
      if (!business) {
        return NextResponse.json(
          { error: "No business found. Please set up a business first." },
          { status: 400 }
        );
      }
      businessId = business.id;
    }

    const category = await prisma.productCategory.create({
      data: {
        name,
        description,
        sortOrder: sortOrder || 0,
        businessId,
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
