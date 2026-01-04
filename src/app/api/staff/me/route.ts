import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/staff/me - Get current user's staff profile and schedule
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find staff record for current user
    const staff = await prisma.staff.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        schedules: {
          include: {
            breaks: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff profile", details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/staff/me - Update current user's staff profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, bio, phone } = body;

    // Find staff record for current user
    const staff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff profile not found" },
        { status: 404 }
      );
    }

    // Update staff record
    const updatedStaff = await prisma.staff.update({
      where: { id: staff.id },
      data: {
        displayName: displayName || undefined,
        bio: bio || undefined,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        schedules: {
          include: {
            breaks: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update user phone if provided
    if (phone !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone },
      });
    }

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("Error updating staff profile:", error);
    return NextResponse.json(
      { error: "Failed to update staff profile" },
      { status: 500 }
    );
  }
}
