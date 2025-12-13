import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/appointments/[id]/cancel - Cancel appointment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        internalNotes: reason ? `Cancelled: ${reason}` : "Cancelled",
      },
      include: {
        client: true,
      },
    });

    // Create activity for client
    if (appointment.clientId) {
      await prisma.activity.create({
        data: {
          clientId: appointment.clientId,
          type: "APPOINTMENT_CANCELLED",
          title: "Appointment Cancelled",
          description: reason || "Appointment was cancelled",
          metadata: { appointmentId: appointment.id },
        },
      });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
