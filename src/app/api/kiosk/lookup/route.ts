import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/kiosk/lookup
// Public, unauthenticated endpoint for kiosks to find a client's appointments today.
// Body: { phone: string, locationId?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = (body.phone || "").replace(/\D/g, "");
    const locationId: string | undefined = body.locationId;

    if (!phone || phone.length < 7) {
      return NextResponse.json(
        { error: "A valid phone number is required" },
        { status: 400 }
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Match phone in either client.phone OR appointment.clientPhone (walk-in)
    const phoneVariants = [
      phone,
      `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`,
      `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6, 10)}`,
      `+1${phone}`,
      `1${phone}`,
    ];

    const where: Record<string, unknown> = {
      scheduledStart: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      OR: [
        { client: { phone: { in: phoneVariants } } },
        { client: { mobile: { in: phoneVariants } } },
        { clientPhone: { in: phoneVariants } },
      ],
    };
    if (locationId) where.locationId = locationId;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        staff: {
          select: {
            id: true,
            displayName: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        services: {
          include: {
            service: { select: { id: true, name: true, duration: true } },
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Kiosk lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up appointments" },
      { status: 500 }
    );
  }
}
