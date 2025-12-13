import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/waitlist/[id] - Get waitlist entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const entry = await prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        client: true,
        location: true,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist entry" },
      { status: 500 }
    );
  }
}

// PUT /api/waitlist/[id] - Update waitlist entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const entry = await prisma.waitlistEntry.update({
      where: { id },
      data: body,
      include: {
        client: true,
        location: true,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to update waitlist entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/waitlist/[id] - Remove from waitlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: "LEFT",
        leftAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from waitlist:", error);
    return NextResponse.json(
      { error: "Failed to remove from waitlist" },
      { status: 500 }
    );
  }
}
