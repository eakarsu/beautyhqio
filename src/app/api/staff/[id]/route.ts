import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/staff/[id] - Get staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        user: true,
        location: true,
        schedules: true,
        timeOff: {
          where: {
            endDate: {
              gte: new Date(),
            },
          },
        },
        appointments: {
          take: 10,
          orderBy: {
            scheduledStart: "desc",
          },
          include: {
            client: true,
            services: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const staff = await prisma.staff.update({
      where: { id },
      data: body,
      include: {
        user: true,
        location: true,
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: "Failed to update staff" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete related records first
    await prisma.staffSchedule.deleteMany({ where: { staffId: id } });
    await prisma.timeOff.deleteMany({ where: { staffId: id } });

    // Delete the staff member
    await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: "Failed to delete staff" },
      { status: 500 }
    );
  }
}
