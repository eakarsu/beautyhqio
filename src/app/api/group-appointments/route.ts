import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/group-appointments - List group appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const eventType = searchParams.get("eventType");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (startDate || endDate) {
      where.scheduledStart = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const appointments = await prisma.groupAppointment.findMany({
      where,
      include: {
        participants: true,
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    return NextResponse.json(
      appointments.map((apt) => ({
        ...apt,
        pricePerPerson: Number(apt.pricePerPerson),
        depositRequired: apt.depositRequired
          ? Number(apt.depositRequired)
          : null,
        participantCount: apt._count.participants,
        spotsAvailable: apt.maxParticipants - apt._count.participants,
        participants: apt.participants.map((p) => ({
          ...p,
          paidAmount: p.paidAmount ? Number(p.paidAmount) : null,
        })),
      }))
    );
  } catch (error) {
    console.error("Error fetching group appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch group appointments" },
      { status: 500 }
    );
  }
}

// POST /api/group-appointments - Create a new group appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      eventType = "group",
      scheduledStart,
      scheduledEnd,
      staffId,
      locationId,
      serviceId,
      maxParticipants = 10,
      minParticipants = 2,
      pricePerPerson,
      depositRequired,
      hostName,
      hostPhone,
      hostEmail,
      notes,
      participants = [],
    } = body;

    if (!scheduledStart || !scheduledEnd || !staffId || !locationId || !pricePerPerson) {
      return NextResponse.json(
        {
          error:
            "scheduledStart, scheduledEnd, staffId, locationId, and pricePerPerson are required",
        },
        { status: 400 }
      );
    }

    const groupAppointment = await prisma.groupAppointment.create({
      data: {
        name,
        eventType,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        staffId,
        locationId,
        serviceId,
        maxParticipants,
        minParticipants,
        pricePerPerson,
        depositRequired,
        hostName,
        hostPhone,
        hostEmail,
        notes,
        participants: participants.length
          ? {
              create: participants.map(
                (p: {
                  name: string;
                  phone?: string;
                  email?: string;
                  clientId?: string;
                }) => ({
                  name: p.name,
                  phone: p.phone,
                  email: p.email,
                  clientId: p.clientId,
                })
              ),
            }
          : undefined,
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json(
      {
        ...groupAppointment,
        pricePerPerson: Number(groupAppointment.pricePerPerson),
        depositRequired: groupAppointment.depositRequired
          ? Number(groupAppointment.depositRequired)
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating group appointment:", error);
    return NextResponse.json(
      { error: "Failed to create group appointment" },
      { status: 500 }
    );
  }
}
