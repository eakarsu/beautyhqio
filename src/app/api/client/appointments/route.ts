import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/client/appointments - Get client's appointments
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find client profiles linked to this user (could have multiple across businesses)
    const orConditions: Array<Record<string, unknown>> = [];

    if (session.user.id) {
      orConditions.push({ userId: session.user.id });
    }
    if (session.user.email) {
      orConditions.push({ email: session.user.email });
    }

    if (orConditions.length === 0) {
      return NextResponse.json({ appointments: [] });
    }

    const clients = await prisma.client.findMany({
      where: {
        OR: orConditions,
      },
      select: { id: true },
    });

    if (clients.length === 0) {
      // Return empty appointments if no client profile exists yet
      return NextResponse.json({ appointments: [] });
    }

    const clientIds = clients.map(c => c.id);

    const appointments = await prisma.appointment.findMany({
      where: { clientId: { in: clientIds } },
      orderBy: { scheduledStart: "desc" },
      include: {
        location: {
          include: {
            business: {
              select: { name: true },
            },
          },
        },
        services: {
          include: {
            service: {
              select: { name: true, duration: true, price: true },
            },
          },
        },
        staff: {
          select: { displayName: true },
        },
      },
    });

    return NextResponse.json({
      appointments: appointments.map((apt) => ({
        id: apt.id,
        scheduledStart: apt.scheduledStart.toISOString(),
        scheduledEnd: apt.scheduledEnd.toISOString(),
        status: apt.status,
        salon: {
          name: apt.location.business.name,
          address: apt.location.address,
        },
        services: apt.services.map((s) => ({
          name: s.service.name,
          duration: s.service.duration,
          price: Number(s.service.price),
        })),
        staff: {
          displayName: apt.staff.displayName || "Staff",
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching client appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
