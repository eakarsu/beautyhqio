import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/packages - List all packages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";

    const packages = await prisma.package.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: {
        services: true,
        _count: {
          select: { purchases: true },
        },
      },
      orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(
      packages.map((p) => ({
        ...p,
        price: Number(p.price),
        originalValue: Number(p.originalValue),
        savingsAmount: Number(p.savingsAmount),
        savingsPercent: Number(p.savingsPercent),
        purchaseCount: p._count.purchases,
      }))
    );
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

// POST /api/packages - Create a new package
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      name,
      description,
      price,
      services,
      validityDays = 365,
      image,
      isPopular = false,
    } = body;

    if (!businessId || !name || !price || !services?.length) {
      return NextResponse.json(
        { error: "businessId, name, price, and services are required" },
        { status: 400 }
      );
    }

    // Calculate original value from services
    const serviceData = await prisma.service.findMany({
      where: {
        id: { in: services.map((s: { serviceId: string }) => s.serviceId) },
      },
      select: { id: true, price: true },
    });

    let originalValue = 0;
    services.forEach(
      (s: { serviceId: string; quantity: number }) => {
        const service = serviceData.find((sd) => sd.id === s.serviceId);
        if (service) {
          originalValue += Number(service.price) * (s.quantity || 1);
        }
      }
    );

    const savingsAmount = originalValue - price;
    const savingsPercent = originalValue > 0 ? (savingsAmount / originalValue) * 100 : 0;

    const pkg = await prisma.package.create({
      data: {
        businessId,
        name,
        description,
        price,
        originalValue,
        savingsAmount,
        savingsPercent,
        validityDays,
        image,
        isPopular,
        services: {
          create: services.map(
            (s: { serviceId: string; quantity: number }) => ({
              serviceId: s.serviceId,
              quantity: s.quantity || 1,
            })
          ),
        },
      },
      include: {
        services: true,
      },
    });

    return NextResponse.json(
      {
        ...pkg,
        price: Number(pkg.price),
        originalValue: Number(pkg.originalValue),
        savingsAmount: Number(pkg.savingsAmount),
        savingsPercent: Number(pkg.savingsPercent),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
