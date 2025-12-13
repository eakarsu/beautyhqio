import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/staff/[id]/schedule - Get staff schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const schedules = await prisma.staffSchedule.findMany({
      where: { staffId: id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// PUT /api/staff/[id]/schedule - Update staff schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { schedules } = body;

    // Delete existing schedules
    await prisma.staffSchedule.deleteMany({
      where: { staffId: id },
    });

    // Create new schedules
    const created = await prisma.staffSchedule.createMany({
      data: schedules.map((s: any) => ({
        staffId: id,
        dayOfWeek: s.dayOfWeek,
        scheduledStart: s.startTime,
        endTime: s.endTime,
        breakStart: s.breakStart,
        breakEnd: s.breakEnd,
        isWorking: s.isWorking,
      })),
    });

    const newSchedules = await prisma.staffSchedule.findMany({
      where: { staffId: id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(newSchedules);
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}
