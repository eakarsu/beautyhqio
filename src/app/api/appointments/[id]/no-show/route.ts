import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/appointments/[id]/no-show - Mark appointment as no-show
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "NO_SHOW",
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
          type: "NO_SHOW",
          title: "No Show",
          description: "Client did not show up for appointment",
          metadata: { appointmentId: appointment.id },
        },
      });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error marking no-show:", error);
    return NextResponse.json(
      { error: "Failed to mark as no-show" },
      { status: 500 }
    );
  }
}
