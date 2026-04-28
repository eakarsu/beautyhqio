import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/kiosk/check-in
// Public unauthenticated endpoint for self-service kiosk check-in.
// Body: { appointmentId: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, status: true, clientId: true, scheduledStart: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }
    if (["CANCELLED", "NO_SHOW", "COMPLETED"].includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot check in: appointment is ${existing.status}` },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CHECKED_IN", checkedInAt: new Date() },
      include: {
        client: true,
        staff: { include: { user: true } },
        services: { include: { service: true } },
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Kiosk check-in error:", error);
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }
}
