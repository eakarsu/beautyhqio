import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/appointments - List appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const staffId = searchParams.get("staffId");
    const locationId = searchParams.get("locationId");
    const status = searchParams.get("status");

    const where: any = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.scheduledStart = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (staffId) where.staffId = staffId;
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        staff: {
          include: {
            user: true,
          },
        },
        location: true,
        services: {
          include: {
            service: true,
            addOns: {
              include: {
                addOn: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledStart: "asc",
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      staffId,
      locationId,
      scheduledStart,
      scheduledEnd,
      services,
      notes,
      source = "PHONE",
    } = body;

    // Get locationId - use provided or get default location
    let finalLocationId = locationId;
    if (!finalLocationId) {
      const defaultLocation = await prisma.location.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (defaultLocation) {
        finalLocationId = defaultLocation.id;
      } else {
        return NextResponse.json(
          { error: "No location found. Please create a location first." },
          { status: 400 }
        );
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        staffId,
        locationId: finalLocationId,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        notes,
        source,
        services: {
          create: services.map((s: any) => ({
            serviceId: s.serviceId,
            price: s.price,
            duration: s.duration,
          })),
        },
      },
      include: {
        client: true,
        staff: {
          include: {
            user: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    // Create activity for client
    if (clientId) {
      await prisma.activity.create({
        data: {
          clientId,
          type: "APPOINTMENT_BOOKED",
          title: "Appointment Booked",
          description: `Booked for ${new Date(scheduledStart).toLocaleDateString()}`,
          metadata: { appointmentId: appointment.id },
        },
      });
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
