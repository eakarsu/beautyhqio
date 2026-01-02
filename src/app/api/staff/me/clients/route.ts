import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/staff/me/clients - Get clients the current staff has served
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find staff record for current user
    const staff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Get unique clients from completed appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        staffId: staff.id,
        status: "COMPLETED",
        clientId: { not: null },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { scheduledStart: "desc" },
    });

    // Group by client and count visits
    const clientMap = new Map<string, {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string;
      lastVisit: string | null;
      totalVisits: number;
    }>();

    for (const apt of appointments) {
      if (!apt.client) continue;

      const existing = clientMap.get(apt.client.id);
      if (existing) {
        existing.totalVisits++;
      } else {
        clientMap.set(apt.client.id, {
          id: apt.client.id,
          firstName: apt.client.firstName,
          lastName: apt.client.lastName,
          email: apt.client.email,
          phone: apt.client.phone,
          lastVisit: apt.scheduledStart.toISOString(),
          totalVisits: 1,
        });
      }
    }

    const clients = Array.from(clientMap.values());

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching staff clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
