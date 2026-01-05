import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

// GET /api/client/appointments - Get client's appointments
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find client profiles linked to this user (could have multiple across businesses)
    const orConditions: Array<Record<string, unknown>> = [];

    if (user.id) {
      orConditions.push({ userId: user.id });
    }
    if (user.email) {
      orConditions.push({ email: user.email });
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
              select: { name: true, phone: true },
            },
          },
        },
        services: {
          include: {
            service: {
              select: { id: true, name: true, duration: true, price: true },
            },
          },
        },
        staff: {
          select: { id: true, displayName: true, photo: true },
        },
      },
    });

    return NextResponse.json({
      appointments: appointments.map((apt) => ({
        id: apt.id,
        scheduledStart: apt.scheduledStart.toISOString(),
        scheduledEnd: apt.scheduledEnd.toISOString(),
        status: apt.status,
        notes: apt.notes,
        locationId: apt.locationId,
        salon: {
          name: apt.location.business.name,
          phone: apt.location.phone,
          address: apt.location.address,
          city: apt.location.city,
          state: apt.location.state,
        },
        services: apt.services.map((s) => ({
          id: s.service.id,
          name: s.service.name,
          duration: s.service.duration,
          price: Number(s.service.price),
        })),
        staff: apt.staff ? {
          id: apt.staff.id,
          displayName: apt.staff.displayName || "Staff",
          photo: apt.staff.photo,
        } : null,
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
