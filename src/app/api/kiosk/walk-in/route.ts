import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/kiosk/walk-in
// Public unauthenticated endpoint to add a walk-in to the waitlist.
// Body: { firstName, lastName?, phone, serviceIds?: string[], notes?, locationId? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName = "",
      phone: rawPhone,
      serviceIds = [],
      notes,
      locationId: bodyLocationId,
    } = body;

    const phone = (rawPhone || "").trim();

    if (!firstName || !phone) {
      return NextResponse.json(
        { error: "firstName and phone are required" },
        { status: 400 }
      );
    }

    // Resolve location
    let locationId = bodyLocationId;
    if (!locationId) {
      const loc = await prisma.location.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, businessId: true },
      });
      if (!loc) {
        return NextResponse.json(
          { error: "No active location configured" },
          { status: 400 }
        );
      }
      locationId = loc.id;
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { businessId: true },
    });
    if (!location) {
      return NextResponse.json(
        { error: "Invalid location" },
        { status: 400 }
      );
    }

    // Find or create client (within the business)
    let client = await prisma.client.findFirst({
      where: {
        businessId: location.businessId,
        OR: [{ phone }, { mobile: phone }],
      },
    });
    if (!client) {
      client = await prisma.client.create({
        data: {
          businessId: location.businessId,
          firstName,
          lastName,
          phone,
          referralSource: "walk_in",
        },
      });
    }

    // Resolve service durations
    const services = serviceIds.length
      ? await prisma.service.findMany({
          where: { id: { in: serviceIds }, businessId: location.businessId },
          select: { id: true, name: true, duration: true },
        })
      : [];
    const totalDuration = services.reduce((s, sv) => s + sv.duration, 0) || 30;
    const serviceNotes =
      services.map((s) => s.name).join(", ") +
      (notes ? ` - ${notes}` : "");

    // Next position
    const lastEntry = await prisma.waitlistEntry.findFirst({
      where: {
        locationId,
        status: { in: ["WAITING", "NOTIFIED"] },
      },
      orderBy: { position: "desc" },
    });
    const position = lastEntry ? lastEntry.position + 1 : 1;
    const estimatedWait = (position - 1) * 15;

    const entry = await prisma.waitlistEntry.create({
      data: {
        locationId,
        clientId: client.id,
        position,
        estimatedWait,
        serviceNotes,
        estimatedDuration: totalDuration,
        phone,
      },
      include: { client: true, location: true },
    });

    return NextResponse.json(
      { ...entry, position, estimatedWait },
      { status: 201 }
    );
  } catch (error) {
    console.error("Kiosk walk-in error:", error);
    return NextResponse.json(
      { error: "Failed to add to waitlist" },
      { status: 500 }
    );
  }
}
