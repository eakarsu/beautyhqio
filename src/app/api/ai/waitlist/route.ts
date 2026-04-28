import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const { locationId: bodyLocationId, dayType } = body;

    const locationFilter: { id?: string; businessId?: string } = {};
    if (bodyLocationId) {
      locationFilter.id = bodyLocationId;
    } else if (user?.businessId) {
      locationFilter.businessId = user.businessId;
    }

    const locations = await prisma.location.findMany({
      where: { ...locationFilter, isActive: true },
    });
    if (!locations.length) {
      return NextResponse.json(
        { error: "No active location found" },
        { status: 404 }
      );
    }

    const locationIds = locations.map((l) => l.id);

    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: {
        locationId: { in: locationIds },
        status: { in: ["WAITING", "NOTIFIED"] },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            _count: { select: { appointments: true } },
          },
        },
      },
      orderBy: { position: "asc" },
    });

    const today = new Date();
    const dow = today.getUTCDay();

    const workingStaff = await prisma.staff.findMany({
      where: {
        locationId: { in: locationIds },
        isActive: true,
        schedules: {
          some: { dayOfWeek: dow, isWorking: true },
        },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        schedules: { where: { dayOfWeek: dow } },
      },
    });

    // Active appointments right now (busy staff)
    const now = new Date();
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        locationId: { in: locationIds },
        scheduledStart: { lte: now },
        scheduledEnd: { gte: now },
        status: { in: ["IN_SERVICE", "CONFIRMED", "CHECKED_IN"] },
      },
      select: { staffId: true, scheduledEnd: true },
    });

    const busyStaffIds = new Set(activeAppointments.map((a) => a.staffId));
    const availableStaffCount = workingStaff.filter(
      (s) => !busyStaffIds.has(s.id)
    ).length;

    const avgServiceMinutes =
      waitlistEntries
        .map((e) => e.estimatedDuration || 45)
        .reduce((sum, d) => sum + d, 0) /
        Math.max(1, waitlistEntries.length) || 45;

    const context = {
      currentWaitlistCount: waitlistEntries.length,
      averageServiceMinutes: Math.round(avgServiceMinutes),
      staffWorkingToday: workingStaff.length,
      staffAvailableNow: availableStaffCount,
      dayType: dayType || ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][dow],
      waitlist: waitlistEntries.map((e) => {
        const c = (e as unknown as { client?: { firstName: string; lastName: string; _count: { appointments: number } } }).client;
        return {
          position: e.position,
          clientName: c ? `${c.firstName} ${c.lastName}` : "Walk-in",
          isReturningClient: (c?._count.appointments || 0) > 1,
          addedMinutesAgo: Math.round(
            (Date.now() - e.addedAt.getTime()) / 60000
          ),
          estimatedDuration: e.estimatedDuration || 45,
          notificationSent: e.notificationSent,
        };
      }),
    };

    const prompt = `You are a smart waitlist optimizer for a beauty salon. Analyze the current waitlist and provide actionable recommendations.

CURRENT STATE (real data from database):
${JSON.stringify(context, null, 2)}

Provide a JSON response with:
{
  "estimatedWaitTime": <minutes for the next person to be seated>,
  "cancellationPredictions": [
    { "position": <number>, "client": "<name>", "risk": <0-100>, "reason": "<why>" }
  ],
  "optimizationSuggestions": ["<actionable tip>", ...],
  "notifyClients": [
    { "position": <number>, "message": "<sms-style message>" }
  ],
  "peakPrediction": {
    "nextPeakHour": "<HH:MM AM/PM>",
    "expectedIncrease": "<+N%>"
  },
  "staffRecommendation": "<one sentence on staffing>"
}

Rules:
- Only include cancellationPredictions for clients in the actual waitlist (max 5)
- notifyClients should only contain entries needing real notification right now
- All numbers should be grounded in the data above`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content:
            "You are an expert salon operations assistant. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 4000, temperature: 0.4 }
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, data: result, context });
  } catch (error) {
    console.error("Waitlist Optimizer Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to optimize waitlist",
      },
      { status: 500 }
    );
  }
}
