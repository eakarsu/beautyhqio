import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/services/[id]/addons/[addonId] - Update an add-on
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  try {
    const { addonId } = await params;
    const body = await request.json();

    const addOn = await prisma.serviceAddOn.update({
      where: { id: addonId },
      data: {
        name: body.name,
        price: body.price,
        duration: body.duration || 0,
      },
    });

    return NextResponse.json(addOn);
  } catch (error) {
    console.error("Error updating add-on:", error);
    return NextResponse.json(
      { error: "Failed to update add-on" },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id]/addons/[addonId] - Delete an add-on
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  try {
    const { addonId } = await params;

    await prisma.serviceAddOn.delete({
      where: { id: addonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting add-on:", error);
    return NextResponse.json(
      { error: "Failed to delete add-on" },
      { status: 500 }
    );
  }
}
