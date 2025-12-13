import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/appointments/[id]/complete - Complete appointment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "COMPLETED",
        actualEnd: new Date(),
        checkedOutAt: new Date(),
      },
      include: {
        client: true,
        staff: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create activity for client
    if (appointment.clientId) {
      await prisma.activity.create({
        data: {
          clientId: appointment.clientId,
          type: "APPOINTMENT_COMPLETED",
          title: "Appointment Completed",
          description: `Visit completed`,
          metadata: { appointmentId: appointment.id },
        },
      });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error completing appointment:", error);
    return NextResponse.json(
      { error: "Failed to complete appointment" },
      { status: 500 }
    );
  }
}
