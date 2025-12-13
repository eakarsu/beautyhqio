import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/staff/[id]/time-off - Get time off requests
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const timeOff = await prisma.timeOff.findMany({
      where: { staffId: id },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(timeOff);
  } catch (error) {
    console.error("Error fetching time off:", error);
    return NextResponse.json(
      { error: "Failed to fetch time off" },
      { status: 500 }
    );
  }
}

// POST /api/staff/[id]/time-off - Request time off
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, startDate, endDate, allDay, startTime, endTime, notes } = body;

    const timeOff = await prisma.timeOff.create({
      data: {
        staffId: id,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay,
        startTime,
        endTime,
        notes,
        status: "pending",
      },
    });

    return NextResponse.json(timeOff, { status: 201 });
  } catch (error) {
    console.error("Error creating time off:", error);
    return NextResponse.json(
      { error: "Failed to create time off" },
      { status: 500 }
    );
  }
}
