import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/packages/[id] - Get package details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        services: true,
        purchases: {
          include: {
            usages: true,
          },
          orderBy: { purchaseDate: "desc" },
          take: 10,
        },
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...pkg,
      price: Number(pkg.price),
      originalValue: Number(pkg.originalValue),
      savingsAmount: Number(pkg.savingsAmount),
      savingsPercent: Number(pkg.savingsPercent),
      purchases: pkg.purchases.map((p) => ({
        ...p,
        pricePaid: Number(p.pricePaid),
      })),
      totalPurchases: pkg._count.purchases,
    });
  } catch (error) {
    console.error("Error fetching package:", error);
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    );
  }
}

// PUT /api/packages/[id] - Update package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const pkg = await prisma.package.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      ...pkg,
      price: Number(pkg.price),
      originalValue: Number(pkg.originalValue),
      savingsAmount: Number(pkg.savingsAmount),
      savingsPercent: Number(pkg.savingsPercent),
    });
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

// DELETE /api/packages/[id] - Deactivate package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.package.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
