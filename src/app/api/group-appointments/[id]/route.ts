import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/group-appointments/[id] - Get group appointment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const appointment = await prisma.groupAppointment.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Group appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...appointment,
      pricePerPerson: Number(appointment.pricePerPerson),
      depositRequired: appointment.depositRequired
        ? Number(appointment.depositRequired)
        : null,
      participants: appointment.participants.map((p) => ({
        ...p,
        paidAmount: p.paidAmount ? Number(p.paidAmount) : null,
      })),
      participantCount: appointment.participants.length,
      spotsAvailable: appointment.maxParticipants - appointment.participants.length,
      totalRevenue: appointment.participants.reduce(
        (sum, p) => sum + (p.paidAmount ? Number(p.paidAmount) : 0),
        0
      ),
    });
  } catch (error) {
    console.error("Error fetching group appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch group appointment" },
      { status: 500 }
    );
  }
}

// PUT /api/group-appointments/[id] - Update group appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const appointment = await prisma.groupAppointment.update({
      where: { id },
      data: body,
      include: {
        participants: true,
      },
    });

    return NextResponse.json({
      ...appointment,
      pricePerPerson: Number(appointment.pricePerPerson),
      depositRequired: appointment.depositRequired
        ? Number(appointment.depositRequired)
        : null,
    });
  } catch (error) {
    console.error("Error updating group appointment:", error);
    return NextResponse.json(
      { error: "Failed to update group appointment" },
      { status: 500 }
    );
  }
}

// DELETE /api/group-appointments/[id] - Cancel group appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.groupAppointment.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling group appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel group appointment" },
      { status: 500 }
    );
  }
}
