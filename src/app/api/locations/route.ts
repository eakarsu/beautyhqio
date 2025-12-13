import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/locations - List locations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const businessId = searchParams.get("businessId");

    const where: Record<string, unknown> = {};
    if (isActive !== null) where.isActive = isActive === "true";
    if (businessId) where.businessId = businessId;

    const locations = await prisma.location.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      address,
      address2,
      city,
      state,
      zip,
      country,
      phone,
      email,
      operatingHours,
      businessId,
      latitude,
      longitude,
      allowOnlineBooking,
      bookingUrl,
      advanceBookingDays,
      cancellationHours,
    } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        address2,
        city,
        state,
        zip,
        country: country || "USA",
        phone,
        email,
        operatingHours,
        businessId,
        latitude,
        longitude,
        allowOnlineBooking: allowOnlineBooking ?? true,
        bookingUrl,
        advanceBookingDays: advanceBookingDays ?? 30,
        cancellationHours: cancellationHours ?? 24,
        isActive: true,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
