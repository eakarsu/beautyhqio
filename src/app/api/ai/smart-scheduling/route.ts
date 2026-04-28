import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

type SlotCandidate = {
  date: string;
  time: string;
  staff: string;
  staffId: string;
  duration: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const SLOT_MINUTES = 30;

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function parseHM(hm: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm);
  if (!m) return null;
  return { h: parseInt(m[1], 10), m: parseInt(m[2], 10) };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientName,
      preferredServices = [],
      serviceIds = [],
      preferredStaff,
      preferredStaffId,
      preferredTime,
      constraints,
      locationId: bodyLocationId,
      daysAhead = 7,
    } = body;

    if (!preferredServices.length && !serviceIds.length) {
      return NextResponse.json(
        { error: "At least one preferred service is required" },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser();

    // Resolve business / location scope
    let locationFilter: { id?: string; businessId?: string } = {};
    if (bodyLocationId) {
      locationFilter.id = bodyLocationId;
    } else if (user?.businessId) {
      locationFilter.businessId = user.businessId;
    }

    const candidateLocations = await prisma.location.findMany({
      where: { ...locationFilter, isActive: true },
    });
    if (!candidateLocations.length) {
      return NextResponse.json(
        { error: "No active location found" },
        { status: 404 }
      );
    }

    // Pick the location with the most upcoming appointments so the AI
    // gets meaningful peak/availability data when no location is specified.
    const upcomingCounts = await prisma.appointment.groupBy({
      by: ["locationId"],
      where: {
        locationId: { in: candidateLocations.map((l) => l.id) },
        scheduledStart: {
          gte: new Date(),
          lte: new Date(Date.now() + daysAhead * DAY_MS),
        },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      _count: { _all: true },
    });
    const locByCount = new Map(
      upcomingCounts.map((c) => [c.locationId, c._count._all])
    );
    const location = bodyLocationId
      ? candidateLocations.find((l) => l.id === bodyLocationId) ||
        candidateLocations[0]
      : [...candidateLocations].sort(
          (a, b) => (locByCount.get(b.id) || 0) - (locByCount.get(a.id) || 0)
        )[0];
    const businessId = location.businessId;

    // Resolve services (by id or by name)
    const services = await prisma.service.findMany({
      where: {
        businessId,
        isActive: true,
        OR: [
          serviceIds.length ? { id: { in: serviceIds } } : undefined,
          preferredServices.length
            ? { name: { in: preferredServices, mode: "insensitive" } }
            : undefined,
        ].filter(Boolean) as object[],
      },
      include: { category: true },
    });

    if (!services.length) {
      return NextResponse.json(
        { error: "Requested services not found in this business" },
        { status: 404 }
      );
    }

    const totalServiceDuration = services.reduce(
      (sum, s) => sum + s.duration,
      0
    );
    const requestedServiceIds = services.map((s) => s.id);

    // Staff in this location, optionally filtered by preferred staff
    const staffWhere: Record<string, unknown> = {
      locationId: location.id,
      isActive: true,
      isBookableOnline: true,
    };
    if (preferredStaffId) staffWhere.id = preferredStaffId;

    const allStaff = await prisma.staff.findMany({
      where: staffWhere,
      include: {
        user: { select: { firstName: true, lastName: true } },
        schedules: { include: { breaks: true } },
        timeOff: {
          where: {
            endDate: { gte: new Date() },
            status: "approved",
          },
        },
      },
    });

    // Filter to staff who can perform at least one of the requested services
    const capableStaff = allStaff.filter(
      (s) =>
        s.serviceIds.length === 0 ||
        s.serviceIds.some((id) => requestedServiceIds.includes(id))
    );
    const candidates = capableStaff.length ? capableStaff : allStaff;

    // Time window
    const now = new Date();
    const startWindow = new Date(now.getTime());
    const endWindow = new Date(now.getTime() + daysAhead * DAY_MS);

    // Existing appointments to exclude
    const existing = await prisma.appointment.findMany({
      where: {
        locationId: location.id,
        scheduledStart: { gte: startWindow, lte: endWindow },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        staffId: { in: candidates.map((s) => s.id) },
      },
      select: {
        staffId: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
    });

    const busyByStaff = new Map<string, { s: Date; e: Date }[]>();
    const peakCounts: Record<string, number> = {};
    for (const a of existing) {
      const arr = busyByStaff.get(a.staffId) || [];
      arr.push({ s: a.scheduledStart, e: a.scheduledEnd });
      busyByStaff.set(a.staffId, arr);

      const hourKey =
        String(a.scheduledStart.getUTCHours()).padStart(2, "0") + ":00";
      peakCounts[hourKey] = (peakCounts[hourKey] || 0) + 1;
    }

    // Build available slots
    const availableSlots: SlotCandidate[] = [];

    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
      const day = new Date(startWindow.getTime() + dayOffset * DAY_MS);
      const dow = day.getUTCDay();

      for (const staff of candidates) {
        const sched = staff.schedules.find((s) => s.dayOfWeek === dow);
        if (!sched || !sched.isWorking) continue;

        const start = parseHM(sched.startTime);
        const end = parseHM(sched.endTime);
        if (!start || !end) continue;

        const dayStart = new Date(
          Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), start.h, start.m)
        );
        const dayEnd = new Date(
          Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), end.h, end.m)
        );

        // Time-off check
        const offToday = staff.timeOff.some(
          (t) => t.startDate <= dayEnd && t.endDate >= dayStart
        );
        if (offToday) continue;

        // Iterate slots
        for (
          let slot = new Date(Math.max(dayStart.getTime(), now.getTime()));
          slot.getTime() + totalServiceDuration * 60_000 <= dayEnd.getTime();
          slot = new Date(slot.getTime() + SLOT_MINUTES * 60_000)
        ) {
          const slotEnd = new Date(slot.getTime() + totalServiceDuration * 60_000);

          // Break check
          const inBreak = sched.breaks.some((b) => {
            const bs = parseHM(b.startTime);
            const be = parseHM(b.endTime);
            if (!bs || !be) return false;
            const bStart = new Date(
              Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), bs.h, bs.m)
            );
            const bEnd = new Date(
              Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), be.h, be.m)
            );
            return slot < bEnd && slotEnd > bStart;
          });
          if (inBreak) continue;

          const busy = busyByStaff.get(staff.id) || [];
          const conflict = busy.some((b) => slot < b.e && slotEnd > b.s);
          if (conflict) continue;

          availableSlots.push({
            date: fmtDate(slot),
            time: fmtTime(slot),
            staff:
              staff.displayName ||
              `${staff.user.firstName} ${staff.user.lastName}`,
            staffId: staff.id,
            duration: totalServiceDuration,
          });

          if (availableSlots.length >= 60) break;
        }
        if (availableSlots.length >= 60) break;
      }
      if (availableSlots.length >= 60) break;
    }

    // Peak hours from busy density
    const peakHours = Object.entries(peakCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => h);

    // Staff specialties from real serviceIds
    const allServicesMap = new Map(
      (
        await prisma.service.findMany({
          where: { businessId, isActive: true },
          select: { id: true, name: true },
        })
      ).map((s) => [s.id, s.name])
    );

    const staffSpecialties: Record<string, string[]> = {};
    for (const s of candidates) {
      const name =
        s.displayName || `${s.user.firstName} ${s.user.lastName}`;
      const svcNames = s.serviceIds
        .map((id) => allServicesMap.get(id))
        .filter(Boolean) as string[];
      staffSpecialties[name] = svcNames.length
        ? svcNames
        : s.specialties || [];
    }

    const scheduleContext = {
      availableSlots: availableSlots.slice(0, 20),
      peakHours,
      staffSpecialties,
      requestedServices: services.map((s) => ({
        name: s.name,
        duration: s.duration,
        price: Number(s.price),
      })),
      totalDurationMinutes: totalServiceDuration,
    };

    const serviceNamesList = services.map((s) => s.name).join(", ");

    const prompt = `You are a smart scheduling assistant for a beauty salon. Help optimize appointment scheduling based on the following:

CLIENT REQUEST:
- Client: ${clientName || "New Client"}
- Requested Services: ${serviceNamesList}
- Preferred Staff: ${preferredStaff || "Any available"}
- Preferred Time: ${preferredTime || "Flexible"}
${constraints ? `- Special Constraints: ${constraints}` : ""}

CURRENT SCHEDULE DATA (real availability from database):
${JSON.stringify(scheduleContext, null, 2)}

Please analyze and provide:
1. Top 3 recommended appointment slots with reasoning (must come from availableSlots above)
2. Staff matching recommendations based on service specialty
3. Tips to optimize the booking
4. Alternative suggestions if preferred time is busy

Respond in JSON format:
{
  "recommendedSlots": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM AM/PM",
      "staff": "Staff Name",
      "services": ["service1"],
      "totalDuration": 60,
      "reason": "Why this slot is recommended",
      "confidence": 95
    }
  ],
  "staffRecommendations": [
    {
      "staff": "Staff Name",
      "specialty": "Their specialty",
      "matchScore": 90,
      "reason": "Why they're a good match"
    }
  ],
  "optimizationTips": ["tip1", "tip2"],
  "alternativeOptions": ["option1", "option2"],
  "peakTimeWarning": "Warning message if booking during peak hours, or null"
}

IMPORTANT: If peakHours array is empty, return null for peakTimeWarning (do not say "data is unavailable" — just null). Only generate a warning when the recommended slot's hour matches one in peakHours.`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content:
            "You are an expert scheduling assistant for beauty and wellness businesses. Optimize appointments for client satisfaction and business efficiency. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 10000, temperature: 0.5 }
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        success: true,
        data: result,
        scheduleContext,
      });
    }

    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("Smart Scheduling Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate scheduling recommendations",
      },
      { status: 500 }
    );
  }
}
