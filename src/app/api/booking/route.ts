import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAppointmentConfirmationEmail } from "@/lib/email";
import { sendAppointmentConfirmationSMS } from "@/lib/twilio";

// POST /api/booking - Create online booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      locationId,
      serviceId,
      serviceIds, // Support multiple services
      staffId,
      date,
      time,
      firstName,
      lastName,
      email,
      phone,
      notes,
      source = "online",
      rescheduleId,
    } = body;

    // Support both single serviceId and array of serviceIds
    const allServiceIds: string[] = serviceIds?.length > 0
      ? serviceIds
      : (serviceId ? [serviceId] : []);

    // Validate required fields (phone is optional if email is provided)
    if (!locationId || allServiceIds.length === 0 || !date || !time || !firstName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Need at least one contact method
    if (!phone && !email) {
      return NextResponse.json(
        { error: "Please provide a phone number or email" },
        { status: 400 }
      );
    }

    // Get location to find businessId
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Get all service details
    const services = await prisma.service.findMany({
      where: { id: { in: allServiceIds } },
    });

    if (services.length === 0) {
      return NextResponse.json(
        { error: "No valid services found" },
        { status: 404 }
      );
    }

    // Calculate total duration from all services
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

    // Parse date and time - use explicit local time to avoid timezone issues
    const [hour, min] = time.split(":").map(Number);
    const [year, month, day] = date.split("-").map(Number);
    const scheduledStart = new Date(year, month - 1, day, hour, min, 0, 0);
    const scheduledEnd = new Date(scheduledStart.getTime() + totalDuration * 60000);

    // Primary service for display purposes
    const primaryService = services[0];

    // Check if user is logged in
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Find or create client for this business
    // First, check if there's already a client linked to this userId
    let client = userId
      ? await prisma.client.findFirst({
          where: { businessId: location.businessId, userId },
        })
      : null;

    // If no client found by userId, search by email or phone
    if (!client) {
      client = await prisma.client.findFirst({
        where: {
          businessId: location.businessId,
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });
    }

    if (!client) {
      client = await prisma.client.create({
        data: {
          firstName,
          lastName: lastName || "",
          email,
          phone,
          referralSource: source,
          businessId: location.businessId,
          userId: userId || null,
        },
      });
    } else {
      // Update client info if needed
      const updates: Record<string, string | null> = {};
      if (userId && !client.userId) {
        // Only link userId if no other client has it for this business
        const existingUserClient = await prisma.client.findFirst({
          where: { businessId: location.businessId, userId },
        });
        if (!existingUserClient) {
          updates.userId = userId;
        }
      }
      // Update contact info if provided and missing
      if (email && !client.email) updates.email = email;
      if (phone && !client.phone) updates.phone = phone;

      if (Object.keys(updates).length > 0) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: updates,
        });
      }
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

    // Create appointment with all services
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
          create: services.map((svc) => ({
            serviceId: svc.id,
            price: svc.price,
            duration: svc.duration,
          })),
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
    const serviceNames = services.map((s) => s.name).join(", ");
    await prisma.activity.create({
      data: {
        clientId: client.id,
        type: "APPOINTMENT_BOOKED",
        title: `Booked ${serviceNames}`,
        description: `Appointment on ${scheduledStart.toLocaleDateString()} at ${time}`,
        metadata: { appointmentId: appointment.id, source },
      },
    });

    // If this is a reschedule, cancel the old appointment
    if (rescheduleId) {
      await prisma.appointment.update({
        where: { id: rescheduleId },
        data: { status: "CANCELLED" },
      });

      await prisma.activity.create({
        data: {
          clientId: client.id,
          type: "APPOINTMENT_CANCELLED",
          title: "Appointment Rescheduled",
          description: `Rescheduled to ${scheduledStart.toLocaleDateString()} at ${time}`,
          metadata: {
            oldAppointmentId: rescheduleId,
            newAppointmentId: appointment.id,
            isReschedule: true,
          },
        },
      });
    }

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
          serviceNames,
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

    // Send confirmation SMS if client has phone and allows SMS
    if (client.phone && client.allowSms !== false) {
      try {
        // Get business settings for SMS
        const settings = await prisma.settings.findFirst();

        // Format date and time for SMS
        const formattedDate = scheduledStart.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        const formattedTime = scheduledStart.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        await sendAppointmentConfirmationSMS(
          client.phone,
          `${client.firstName}`,
          formattedDate,
          formattedTime,
          serviceNames,
          settings?.businessName || 'Beauty & Wellness',
          client.preferredLanguage || 'en'
        );
      } catch (smsError) {
        // Log but don't fail the booking if SMS fails
        console.error('Failed to send confirmation SMS:', smsError);
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
