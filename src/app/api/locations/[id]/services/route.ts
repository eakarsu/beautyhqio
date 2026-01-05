import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/locations/[id]/services - Get services for a location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the location and its business
    const location = await prisma.location.findUnique({
      where: { id },
      select: { businessId: true },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Get services for this business
    const services = await prisma.service.findMany({
      where: {
        businessId: location.businessId,
        isActive: true,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: [
        { category: { name: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json(
      services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: Number(service.price),
        categoryName: service.category?.name,
      }))
    );
  } catch (error) {
    console.error("Error fetching location services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
