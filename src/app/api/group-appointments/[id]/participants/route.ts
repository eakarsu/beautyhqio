import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/group-appointments/[id]/participants - Add participant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, clientId, paidAmount } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Check if group appointment exists and has space
    const appointment = await prisma.groupAppointment.findUnique({
      where: { id },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Group appointment not found" },
        { status: 404 }
      );
    }

    if (appointment._count.participants >= appointment.maxParticipants) {
      return NextResponse.json(
        { error: "Group appointment is full" },
        { status: 400 }
      );
    }

    // Create participant
    const participant = await prisma.groupParticipant.create({
      data: {
        groupAppointmentId: id,
        name,
        phone,
        email,
        clientId,
        paidAmount,
      },
    });

    // Update status if min participants reached
    const newCount = appointment._count.participants + 1;
    if (newCount >= appointment.minParticipants && appointment.status === "pending") {
      await prisma.groupAppointment.update({
        where: { id },
        data: { status: "confirmed" },
      });
    }

    return NextResponse.json(
      {
        ...participant,
        paidAmount: participant.paidAmount ? Number(participant.paidAmount) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding participant:", error);
    return NextResponse.json(
      { error: "Failed to add participant" },
      { status: 500 }
    );
  }
}

// DELETE /api/group-appointments/[id]/participants - Remove participant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId is required" },
        { status: 400 }
      );
    }

    await prisma.groupParticipant.delete({
      where: { id: participantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json(
      { error: "Failed to remove participant" },
      { status: 500 }
    );
  }
}

// PATCH /api/group-appointments/[id]/participants - Update participant
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, ...updates } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId is required" },
        { status: 400 }
      );
    }

    const participant = await prisma.groupParticipant.update({
      where: { id: participantId },
      data: updates,
    });

    return NextResponse.json({
      ...participant,
      paidAmount: participant.paidAmount ? Number(participant.paidAmount) : null,
    });
  } catch (error) {
    console.error("Error updating participant:", error);
    return NextResponse.json(
      { error: "Failed to update participant" },
      { status: 500 }
    );
  }
}
