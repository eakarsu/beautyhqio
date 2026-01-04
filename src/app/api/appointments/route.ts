import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentConfirmationEmail } from "@/lib/email";
import { sendAppointmentConfirmationSMS } from "@/lib/twilio";
import { getAuthenticatedUser } from "@/lib/api-auth";

// GET /api/appointments - List appointments
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const staffId = searchParams.get("staffId");
    const locationId = searchParams.get("locationId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (date) {
      // Use UTC to avoid timezone issues - appointments are stored in UTC
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      where.scheduledStart = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (staffId) where.staffId = staffId;
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;

    // Apply business filter - filter appointments by their location's businessId
    if (!user.isPlatformAdmin && user.businessId) {
      const locations = await prisma.location.findMany({
        where: { businessId: user.businessId },
        select: { id: true },
      });
      const locationIds = locations.map((l) => l.id);
      if (locationIds.length > 0) {
        where.locationId = locationId ? locationId : { in: locationIds };
      }
    }

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
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Get locationId - use provided or get default location for this business
    let finalLocationId = locationId;
    if (!finalLocationId) {
      const locationWhere: Record<string, unknown> = {};
      if (!user.isPlatformAdmin && user.businessId) {
        locationWhere.businessId = user.businessId;
      }
      const defaultLocation = await prisma.location.findFirst({
        where: locationWhere,
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
    } else {
      // Verify the location belongs to the user's business
      if (!user.isPlatformAdmin && user.businessId) {
        const location = await prisma.location.findUnique({
          where: { id: finalLocationId },
        });
        if (location?.businessId !== user.businessId) {
          return NextResponse.json({ error: "Location does not belong to your business" }, { status: 403 });
        }
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

    // Send confirmation email if client has email
    if (appointment.client?.email) {
      try {
        // Get business settings and location for email
        const settings = await prisma.settings.findFirst();
        const location = await prisma.location.findUnique({
          where: { id: finalLocationId },
        });

        const staffName = appointment.staff?.displayName ||
          `${appointment.staff?.user?.firstName || ''} ${appointment.staff?.user?.lastName || ''}`.trim() ||
          'Our Team';

        const serviceName = appointment.services?.[0]?.service?.name || 'Appointment';
        const startDate = new Date(scheduledStart);

        // Format date and time for email
        const formattedDate = startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const formattedTime = startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        await sendAppointmentConfirmationEmail(
          appointment.client.email,
          `${appointment.client.firstName} ${appointment.client.lastName || ''}`.trim(),
          formattedDate,
          formattedTime,
          serviceName,
          staffName,
          settings?.businessName || 'Beauty & Wellness',
          settings?.phone || location?.phone || '',
          settings?.address || location?.address || '',
          appointment.client.preferredLanguage || 'en'
        );
      } catch (emailError) {
        // Log but don't fail the appointment if email fails
        console.error('Failed to send confirmation email:', emailError);
      }
    }

    // Send confirmation SMS if client has phone and allows SMS
    if (appointment.client?.phone && appointment.client?.allowSms !== false) {
      try {
        // Get business settings for SMS
        const settings = await prisma.settings.findFirst();
        const serviceName = appointment.services?.[0]?.service?.name || 'Appointment';
        const startDate = new Date(scheduledStart);

        // Format date and time for SMS (shorter format)
        const formattedDate = startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        const formattedTime = startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        await sendAppointmentConfirmationSMS(
          appointment.client.phone,
          appointment.client.firstName,
          formattedDate,
          formattedTime,
          serviceName,
          settings?.businessName || 'Beauty & Wellness',
          appointment.client.preferredLanguage || 'en'
        );
      } catch (smsError) {
        // Log but don't fail the appointment if SMS fails
        console.error('Failed to send confirmation SMS:', smsError);
      }
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
