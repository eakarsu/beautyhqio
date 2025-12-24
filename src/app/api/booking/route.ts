import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentConfirmationEmail } from "@/lib/email";

// POST /api/booking - Create online booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      locationId,
      serviceId,
      staffId,
      date,
      time,
      firstName,
      lastName,
      email,
      phone,
      notes,
      source = "online",
    } = body;

    // Validate required fields
    if (!locationId || !serviceId || !date || !time || !firstName || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Parse date and time
    const [hour, min] = time.split(":").map(Number);
    const scheduledStart = new Date(date);
    scheduledStart.setHours(hour, min, 0, 0);
    const scheduledEnd = new Date(scheduledStart.getTime() + service.duration * 60000);

    // Find or create client
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          { phone },
        ],
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          firstName,
          lastName: lastName || "",
          email,
          phone,
          referralSource: source,
        },
      });
    }

    // Select staff if not provided
    let selectedStaffId = staffId;
    if (!selectedStaffId) {
      // Find available staff
      const availableStaff = await prisma.staff.findFirst({
        where: {
          locationId,
          isActive: true,
        },
      });
      selectedStaffId = availableStaff?.id;
    }

    if (!selectedStaffId) {
      return NextResponse.json(
        { error: "No staff available" },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflict = await prisma.appointment.findFirst({
      where: {
        staffId: selectedStaffId,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        OR: [
          {
            AND: [
              { scheduledStart: { lte: scheduledStart } },
              { scheduledEnd: { gt: scheduledStart } },
            ],
          },
          {
            AND: [
              { scheduledStart: { lt: scheduledEnd } },
              { scheduledEnd: { gte: scheduledEnd } },
            ],
          },
          {
            AND: [
              { scheduledStart: { gte: scheduledStart } },
              { scheduledEnd: { lte: scheduledEnd } },
            ],
          },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Time slot no longer available" },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        locationId,
        clientId: client.id,
        staffId: selectedStaffId,
        scheduledStart,
        scheduledEnd,
        status: "CONFIRMED",
        notes,
        source: "ONLINE",
        services: {
          create: {
            serviceId,
            price: service.price,
            duration: service.duration,
          },
        },
      },
      include: {
        client: true,
        staff: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        location: true,
        services: {
          include: { service: true },
        },
      },
    });

    // Create activity for client
    await prisma.activity.create({
      data: {
        clientId: client.id,
        type: "APPOINTMENT_BOOKED",
        title: `Booked ${service.name}`,
        description: `Appointment on ${scheduledStart.toLocaleDateString()} at ${time}`,
        metadata: { appointmentId: appointment.id, source },
      },
    });

    // Send confirmation email if client has email
    if (client.email) {
      try {
        // Get business settings for email
        const settings = await prisma.settings.findFirst();
        const staffName = appointment.staff?.displayName ||
          `${appointment.staff?.user?.firstName || ''} ${appointment.staff?.user?.lastName || ''}`.trim() ||
          'Our Team';

        // Format date and time for email
        const formattedDate = scheduledStart.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const formattedTime = scheduledStart.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        await sendAppointmentConfirmationEmail(
          client.email,
          `${client.firstName} ${client.lastName || ''}`.trim(),
          formattedDate,
          formattedTime,
          service.name,
          staffName,
          settings?.businessName || 'Beauty & Wellness',
          settings?.phone || appointment.location?.phone || '',
          settings?.address || appointment.location?.address || '',
          client.preferredLanguage || 'en'
        );
      } catch (emailError) {
        // Log but don't fail the booking if email fails
        console.error('Failed to send confirmation email:', emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        appointment,
        confirmationNumber: appointment.id.slice(0, 8).toUpperCase(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// GET /api/booking/confirm - Confirm/lookup booking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirmationNumber = searchParams.get("confirmation");
    const email = searchParams.get("email");

    if (!confirmationNumber && !email) {
      return NextResponse.json(
        { error: "Confirmation number or email required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {};

    if (confirmationNumber) {
      where.id = { startsWith: confirmationNumber.toLowerCase() };
    }

    if (email) {
      where.client = { email };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        ...where,
        scheduledStart: { gte: new Date() },
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
      include: {
        client: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        staff: {
          select: {
            displayName: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        location: {
          select: { name: true, address: true, phone: true },
        },
        services: {
          include: { service: true },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error looking up booking:", error);
    return NextResponse.json(
      { error: "Failed to lookup booking" },
      { status: 500 }
    );
  }
}
