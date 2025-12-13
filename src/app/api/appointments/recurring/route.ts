import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Recurrence patterns
interface RecurrenceRule {
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  interval?: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // For weekly: 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // For monthly: 1-31
  endDate?: string; // When to stop recurring
  occurrences?: number; // Or number of occurrences
}

function generateRecurringDates(
  startDate: Date,
  rule: RecurrenceRule,
  maxOccurrences: number = 12
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  const endDate = rule.endDate ? new Date(rule.endDate) : null;
  const occurrences = rule.occurrences || maxOccurrences;
  const interval = rule.interval || 1;

  while (dates.length < occurrences) {
    if (endDate && currentDate > endDate) break;

    // Skip the first date (it's the original appointment)
    if (dates.length > 0 || currentDate.getTime() !== startDate.getTime()) {
      dates.push(new Date(currentDate));
    }

    // Calculate next date based on frequency
    switch (rule.frequency) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      case "biweekly":
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + interval);
        if (rule.dayOfMonth) {
          currentDate.setDate(rule.dayOfMonth);
        }
        break;
    }

    // Safety check
    if (dates.length === 0 && currentDate.getTime() === startDate.getTime()) {
      break;
    }
  }

  return dates.slice(0, occurrences);
}

// GET /api/appointments/recurring - Get recurring appointment series
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const parentId = searchParams.get("parentId");

    const where: Record<string, unknown> = {
      isRecurring: true,
    };

    if (clientId) {
      where.clientId = clientId;
    }

    if (parentId) {
      where.OR = [{ id: parentId }, { parentAppointmentId: parentId }];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: { firstName: true, lastName: true, phone: true },
        },
        staff: {
          select: { displayName: true, photo: true },
        },
        services: {
          include: {
            service: {
              select: { name: true, duration: true, price: true },
            },
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    // Group by parent appointment
    const grouped: Record<string, typeof appointments> = {};
    appointments.forEach((apt) => {
      const parentId = apt.parentAppointmentId || apt.id;
      if (!grouped[parentId]) {
        grouped[parentId] = [];
      }
      grouped[parentId].push(apt);
    });

    return NextResponse.json({
      series: Object.entries(grouped).map(([parentId, apts]) => ({
        parentId,
        recurrenceRule: apts[0].recurrenceRule,
        appointments: apts.map((a) => ({
          id: a.id,
          scheduledStart: a.scheduledStart,
          scheduledEnd: a.scheduledEnd,
          status: a.status,
          client: a.client,
          staff: a.staff,
          services: a.services,
        })),
        count: apts.length,
      })),
    });
  } catch (error) {
    console.error("Error fetching recurring appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring appointments" },
      { status: 500 }
    );
  }
}

// POST /api/appointments/recurring - Create recurring appointment series
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      staffId,
      locationId,
      services,
      scheduledStart,
      scheduledEnd,
      recurrenceRule,
      notes,
      source = "PHONE",
    } = body;

    if (!staffId || !locationId || !scheduledStart || !recurrenceRule) {
      return NextResponse.json(
        {
          error:
            "staffId, locationId, scheduledStart, and recurrenceRule are required",
        },
        { status: 400 }
      );
    }

    const rule: RecurrenceRule = recurrenceRule;
    const startDate = new Date(scheduledStart);
    const endDateTime = scheduledEnd
      ? new Date(scheduledEnd)
      : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

    const duration = endDateTime.getTime() - startDate.getTime();

    // Generate recurring dates
    const recurringDates = generateRecurringDates(startDate, rule);

    // Create the parent appointment first
    const parentAppointment = await prisma.appointment.create({
      data: {
        clientId,
        staffId,
        locationId,
        scheduledStart: startDate,
        scheduledEnd: endDateTime,
        isRecurring: true,
        recurrenceRule: JSON.stringify(rule),
        notes,
        source,
        services: services?.length
          ? {
              create: services.map(
                (s: { serviceId: string; price: number; duration: number }) => ({
                  serviceId: s.serviceId,
                  price: s.price,
                  duration: s.duration,
                })
              ),
            }
          : undefined,
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        staff: {
          select: { displayName: true },
        },
        services: {
          include: {
            service: { select: { name: true } },
          },
        },
      },
    });

    // Create child appointments for recurring dates
    const childAppointments = await Promise.all(
      recurringDates.map(async (date) => {
        const aptEnd = new Date(date.getTime() + duration);

        return prisma.appointment.create({
          data: {
            clientId,
            staffId,
            locationId,
            scheduledStart: date,
            scheduledEnd: aptEnd,
            isRecurring: true,
            recurrenceRule: JSON.stringify(rule),
            parentAppointmentId: parentAppointment.id,
            notes,
            source,
            services: services?.length
              ? {
                  create: services.map(
                    (s: {
                      serviceId: string;
                      price: number;
                      duration: number;
                    }) => ({
                      serviceId: s.serviceId,
                      price: s.price,
                      duration: s.duration,
                    })
                  ),
                }
              : undefined,
          },
        });
      })
    );

    // Create activity for client
    if (clientId) {
      await prisma.activity.create({
        data: {
          clientId,
          type: "APPOINTMENT_BOOKED",
          title: `Recurring appointment series created`,
          description: `${recurringDates.length + 1} appointments scheduled`,
          metadata: {
            parentAppointmentId: parentAppointment.id,
            frequency: rule.frequency,
            totalAppointments: recurringDates.length + 1,
          },
        },
      });
    }

    return NextResponse.json(
      {
        parentAppointment: {
          ...parentAppointment,
          recurrenceRule: rule,
        },
        childAppointments: childAppointments.map((a) => ({
          id: a.id,
          scheduledStart: a.scheduledStart,
          scheduledEnd: a.scheduledEnd,
        })),
        totalCreated: childAppointments.length + 1,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating recurring appointments:", error);
    return NextResponse.json(
      { error: "Failed to create recurring appointments" },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/recurring - Cancel recurring series
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const cancelType = searchParams.get("type") || "all"; // all, future, single

    if (!parentId) {
      return NextResponse.json(
        { error: "parentId is required" },
        { status: 400 }
      );
    }

    let where: Record<string, unknown> = {};

    switch (cancelType) {
      case "all":
        where = {
          OR: [{ id: parentId }, { parentAppointmentId: parentId }],
        };
        break;
      case "future":
        where = {
          OR: [{ id: parentId }, { parentAppointmentId: parentId }],
          scheduledStart: { gte: new Date() },
        };
        break;
      default:
        return NextResponse.json(
          { error: "Invalid cancel type" },
          { status: 400 }
        );
    }

    // Update appointments to cancelled
    const result = await prisma.appointment.updateMany({
      where,
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      success: true,
      cancelledCount: result.count,
    });
  } catch (error) {
    console.error("Error cancelling recurring appointments:", error);
    return NextResponse.json(
      { error: "Failed to cancel recurring appointments" },
      { status: 500 }
    );
  }
}
