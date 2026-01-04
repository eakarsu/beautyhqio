import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface BreakInput {
  startTime: string;
  endTime: string;
  label?: string;
}

interface ScheduleInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
  breaks?: BreakInput[];
}

// GET /api/staff/[id]/schedule - Get staff schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const schedules = await prisma.staffSchedule.findMany({
      where: { staffId: id },
      include: {
        breaks: true,
      },
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
    const { schedules }: { schedules: ScheduleInput[] } = body;

    // Use transaction to delete existing and create new schedules with breaks
    await prisma.$transaction(async (tx) => {
      // Delete existing schedules (cascades to breaks due to onDelete: Cascade)
      await tx.staffSchedule.deleteMany({
        where: { staffId: id },
      });

      // Create new schedules with breaks
      for (const schedule of schedules) {
        await tx.staffSchedule.create({
          data: {
            staffId: id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isWorking: schedule.isWorking,
            breaks: {
              create: (schedule.breaks || []).map((b) => ({
                startTime: b.startTime,
                endTime: b.endTime,
                label: b.label || null,
              })),
            },
          },
        });
      }
    });

    const newSchedules = await prisma.staffSchedule.findMany({
      where: { staffId: id },
      include: {
        breaks: true,
      },
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
