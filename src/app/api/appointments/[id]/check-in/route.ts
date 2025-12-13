import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/appointments/[id]/check-in - Check in client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
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
    console.error("Error checking in appointment:", error);
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }
}
