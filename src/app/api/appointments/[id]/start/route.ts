import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/appointments/[id]/start - Start service for appointment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "IN_SERVICE",
        actualStart: new Date(),
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

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error starting service:", error);
    return NextResponse.json(
      { error: "Failed to start service" },
      { status: 500 }
    );
  }
}
