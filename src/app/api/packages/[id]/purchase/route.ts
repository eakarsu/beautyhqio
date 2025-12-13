import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/packages/[id]/purchase - Purchase a package for a client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientId, pricePaid } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    // Get the package
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        services: true,
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    if (!pkg.isActive) {
      return NextResponse.json(
        { error: "Package is no longer available" },
        { status: 400 }
      );
    }

    // Calculate total services
    const totalServices = pkg.services.reduce(
      (sum, s) => sum + s.quantity,
      0
    );

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

    // Create the purchase
    const purchase = await prisma.packagePurchase.create({
      data: {
        packageId: id,
        clientId,
        pricePaid: pricePaid ?? pkg.price,
        totalServices,
        remainingServices: totalServices,
        expiresAt,
      },
      include: {
        package: true,
      },
    });

    // Create activity for client
    await prisma.activity.create({
      data: {
        clientId,
        type: "PURCHASE",
        title: `Purchased ${pkg.name} package`,
        description: `${totalServices} services, expires ${expiresAt.toLocaleDateString()}`,
        metadata: {
          purchaseId: purchase.id,
          packageId: id,
          packageName: pkg.name,
        },
      },
    });

    return NextResponse.json(
      {
        ...purchase,
        pricePaid: Number(purchase.pricePaid),
        package: {
          ...purchase.package,
          price: Number(purchase.package.price),
          originalValue: Number(purchase.package.originalValue),
          savingsAmount: Number(purchase.package.savingsAmount),
          savingsPercent: Number(purchase.package.savingsPercent),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error purchasing package:", error);
    return NextResponse.json(
      { error: "Failed to purchase package" },
      { status: 500 }
    );
  }
}
