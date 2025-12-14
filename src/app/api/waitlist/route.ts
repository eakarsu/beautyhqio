import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/waitlist - Get current waitlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    const where: any = {
      status: { in: ["WAITING", "NOTIFIED"] },
    };
    if (locationId) where.locationId = locationId;

    const waitlist = await prisma.waitlistEntry.findMany({
      where,
      include: {
        client: true,
        location: true,
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(waitlist);
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}

// POST /api/waitlist - Add to waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      locationId,
      clientId,
      serviceNotes,
      estimatedDuration,
      phone,
    } = body;

    // Get locationId - use provided or get default location
    let finalLocationId = locationId;
    if (!finalLocationId) {
      const defaultLocation = await prisma.location.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (defaultLocation) {
        finalLocationId = defaultLocation.id;
      } else {
        return NextResponse.json(
          { error: "No location found. Please create a location first." },
          { status: 400 }
        );
      }
    }

    // Get next position
    const lastEntry = await prisma.waitlistEntry.findFirst({
      where: {
        locationId: finalLocationId,
        status: { in: ["WAITING", "NOTIFIED"] },
      },
      orderBy: { position: "desc" },
    });

    const position = lastEntry ? lastEntry.position + 1 : 1;

    // Estimate wait time (15 min per person)
    const estimatedWait = (position - 1) * 15;

    const entry = await prisma.waitlistEntry.create({
      data: {
        locationId: finalLocationId,
        clientId,
        position,
        estimatedWait,
        serviceNotes,
        estimatedDuration,
        phone,
      },
      include: {
        client: true,
        location: true,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json(
      { error: "Failed to add to waitlist" },
      { status: 500 }
    );
  }
}
