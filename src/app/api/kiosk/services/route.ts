import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/kiosk/services?locationId=...
// Public unauthenticated list of bookable services for the kiosk.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    let businessId: string | undefined;
    if (locationId) {
      const loc = await prisma.location.findUnique({
        where: { id: locationId },
        select: { businessId: true },
      });
      businessId = loc?.businessId;
    } else {
      const loc = await prisma.location.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: { businessId: true },
      });
      businessId = loc?.businessId;
    }

    if (!businessId) {
      return NextResponse.json([]);
    }

    const services = await prisma.service.findMany({
      where: { businessId, isActive: true, allowOnline: true },
      include: {
        category: { select: { name: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(
      services.map((s) => ({
        id: s.id,
        name: s.name,
        duration: s.duration,
        price: Number(s.price),
        category: s.category?.name || "Other",
      }))
    );
  } catch (error) {
    console.error("Kiosk services error:", error);
    return NextResponse.json(
      { error: "Failed to load services" },
      { status: 500 }
    );
  }
}
