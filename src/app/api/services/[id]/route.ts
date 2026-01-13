import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/services/[id] - Get service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        addOns: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: service.id,
      name: service.name,
      description: service.description,
      price: Number(service.price),
      duration: service.duration,
      category: service.category,
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// PUT /api/services/[id] - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Only allow specific fields to be updated
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.duration !== undefined) updateData.duration = Number(body.duration);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Handle categoryId - can be string ID or object with id
    // Only update if it's a valid-looking ID (not empty, not "undefined")
    let newCategoryId: string | undefined;
    if (body.categoryId && typeof body.categoryId === "string" && body.categoryId.length > 10) {
      newCategoryId = body.categoryId;
    } else if (body.category?.id && typeof body.category.id === "string" && body.category.id.length > 10) {
      newCategoryId = body.category.id;
    }

    // Verify category exists before updating
    if (newCategoryId) {
      const categoryExists = await prisma.serviceCategory.findUnique({
        where: { id: newCategoryId },
      });
      if (categoryExists) {
        updateData.categoryId = newCategoryId;
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        addOns: true,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
