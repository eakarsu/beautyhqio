import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/waitlist/[id]/seat - Seat client from waitlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const entry = await prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: "SEATED",
        seatedAt: new Date(),
      },
      include: {
        client: true,
        location: true,
      },
    });

    // Reorder remaining entries
    const remaining = await prisma.waitlistEntry.findMany({
      where: {
        locationId: entry.locationId,
        status: { in: ["WAITING", "NOTIFIED"] },
      },
      orderBy: { position: "asc" },
    });

    for (let i = 0; i < remaining.length; i++) {
      await prisma.waitlistEntry.update({
        where: { id: remaining[i].id },
        data: {
          position: i + 1,
          estimatedWait: i * 15,
        },
      });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error seating client:", error);
    return NextResponse.json(
      { error: "Failed to seat client" },
      { status: 500 }
    );
  }
}
