import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products - List products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const categoryId = searchParams.get("categoryId");
    const lowStock = searchParams.get("lowStock");

    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (categoryId) where.categoryId = categoryId;
    if (lowStock === "true") {
      where.quantityOnHand = {
        lte: prisma.product.fields.reorderLevel,
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      categoryId,
      name,
      description,
      brand,
      sku,
      barcode,
      size,
      cost,
      price,
      quantityOnHand,
      reorderLevel,
      reorderQuantity,
      isActive,
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

    const product = await prisma.product.create({
      data: {
        businessId: finalBusinessId,
        categoryId: categoryId || null,
        name,
        description,
        brand,
        sku,
        barcode,
        size,
        cost,
        price,
        quantityOnHand: quantityOnHand || 0,
        reorderLevel,
        reorderQuantity,
        isActive: isActive ?? true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);

    // Handle unique constraint error
    if (error.code === "P2002") {
      const field = error.meta?.target?.[1] || "name";
      return NextResponse.json(
        { error: `A product with this ${field} already exists. Please use a different ${field}.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
