import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCommission, COMMISSION_RATES } from "@/lib/commission";
import { SubscriptionPlan } from "@prisma/client";

// POST /api/marketplace/book - Book via marketplace with lead tracking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Lead tracking
      sessionId,
      leadId,
      source,
      utmSource,
      utmMedium,
      utmCampaign,

      // Booking details
      locationId,
      serviceId,
      staffId,
      date,
      time,

      // Client info
      firstName,
      lastName,
      email,
      phone,
      notes,
    } = body;

    // Validate required fields
    if (!locationId || !serviceId || !staffId || !date || !time) {
      return NextResponse.json(
        { error: "Missing required booking fields" },
        { status: 400 }
      );
    }

    if (!firstName || !phone) {
      return NextResponse.json(
        { error: "First name and phone are required" },
        { status: 400 }
      );
    }

    // Get location and service
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { business: true },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Get business subscription for commission calculation
    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId: location.businessId },
    });

    const plan = (subscription?.plan || "STARTER") as SubscriptionPlan;
    const commissionRate = COMMISSION_RATES[plan];

    // Parse date and time
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledStart = new Date(date);
    scheduledStart.setHours(hours, minutes, 0, 0);
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
          referralSource: "marketplace",
        },
      });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        locationId,
        clientId: client.id,
        staffId,
        scheduledStart,
        scheduledEnd,
        status: "CONFIRMED",
        source: "MARKETPLACE",
        notes,
        isConfirmed: true,
        confirmedAt: new Date(),
        services: {
          create: {
            serviceId,
            price: service.price,
            duration: service.duration,
          },
        },
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        staff: {
          select: {
            displayName: true,
          },
        },
        location: {
          select: {
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
      },
    });

    // Calculate appointment total
    const appointmentTotal = Number(service.price);

    // Find or create marketplace lead
    let lead = leadId
      ? await prisma.marketplaceLead.findUnique({ where: { id: leadId } })
      : null;

    if (!lead && sessionId) {
      lead = await prisma.marketplaceLead.findFirst({
        where: { sessionId, businessId: location.businessId },
      });
    }

    if (lead) {
      // Update existing lead
      await prisma.marketplaceLead.update({
        where: { id: lead.id },
        data: {
          status: "BOOKED",
          bookedAt: new Date(),
          appointmentId: appointment.id,
          clientId: client.id,
          locationId,
          commissionRate,
        },
      });
    } else {
      // Create new lead
      lead = await prisma.marketplaceLead.create({
        data: {
          sessionId,
          businessId: location.businessId,
          locationId,
          appointmentId: appointment.id,
          clientId: client.id,
          source: source || "MARKETPLACE_SEARCH",
          status: "BOOKED",
          bookedAt: new Date(),
          utmSource,
          utmMedium,
          utmCampaign,
          commissionRate,
        },
      });
    }

    // Create activity for client
    await prisma.activity.create({
      data: {
        clientId: client.id,
        type: "APPOINTMENT_BOOKED",
        title: `Booked ${service.name}`,
        description: `Appointment on ${scheduledStart.toLocaleDateString()} at ${time} (via marketplace)`,
        metadata: {
          appointmentId: appointment.id,
          source: "marketplace",
          leadId: lead.id,
        },
      },
    });

    // Calculate estimated commission (will be finalized on completion)
    const { commissionAmount, netToSalon } = calculateCommission(
      appointmentTotal,
      plan
    );

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        confirmationNumber: appointment.id.slice(0, 8).toUpperCase(),
        scheduledStart: appointment.scheduledStart,
        scheduledEnd: appointment.scheduledEnd,
        service: {
          name: service.name,
          duration: service.duration,
          price: appointmentTotal,
        },
        staff: appointment.staff,
        location: appointment.location,
      },
      lead: {
        id: lead.id,
        commissionRate,
        estimatedCommission: commissionAmount,
        netToSalon,
      },
    });
  } catch (error) {
    console.error("Error creating marketplace booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
