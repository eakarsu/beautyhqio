import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/client/appointments/[id] - Get single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find client profiles linked to this user
    const orConditions: Array<Record<string, unknown>> = [];
    if (session.user.id) {
      orConditions.push({ userId: session.user.id });
    }
    if (session.user.email) {
      orConditions.push({ email: session.user.email });
    }

    if (orConditions.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clients = await prisma.client.findMany({
      where: { OR: orConditions },
      select: { id: true },
    });

    const clientIds = clients.map((c) => c.id);

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        clientId: { in: clientIds },
      },
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
          select: {
            id: true,
            displayName: true,
            photo: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        scheduledStart: appointment.scheduledStart.toISOString(),
        scheduledEnd: appointment.scheduledEnd.toISOString(),
        status: appointment.status,
        notes: appointment.notes,
        salon: {
          name: appointment.location.business.name,
          phone: appointment.location.business.phone,
          address: appointment.location.address,
          city: appointment.location.city,
          state: appointment.location.state,
        },
        services: appointment.services.map((s) => ({
          id: s.service.id,
          name: s.service.name,
          duration: s.service.duration,
          price: Number(s.service.price),
        })),
        staff: {
          id: appointment.staff.id,
          displayName:
            appointment.staff.displayName ||
            `${appointment.staff.user?.firstName || ""} ${appointment.staff.user?.lastName || ""}`.trim() ||
            "Staff",
          photo: appointment.staff.photo,
        },
        locationId: appointment.locationId,
      },
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PATCH /api/client/appointments/[id] - Cancel or update appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Find client profiles linked to this user
    const orConditions: Array<Record<string, unknown>> = [];
    if (session.user.id) {
      orConditions.push({ userId: session.user.id });
    }
    if (session.user.email) {
      orConditions.push({ email: session.user.email });
    }

    if (orConditions.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clients = await prisma.client.findMany({
      where: { OR: orConditions },
      select: { id: true },
    });

    const clientIds = clients.map((c) => c.id);

    // Verify appointment belongs to this client
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        clientId: { in: clientIds },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (action === "cancel") {
      // Check if appointment is in the future
      if (new Date(appointment.scheduledStart) <= new Date()) {
        return NextResponse.json(
          { error: "Cannot cancel past appointments" },
          { status: 400 }
        );
      }

      // Check if already cancelled
      if (appointment.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Appointment is already cancelled" },
          { status: 400 }
        );
      }

      // Cancel the appointment
      const updated = await prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // Log activity if client exists
      if (appointment.clientId) {
        await prisma.activity.create({
          data: {
            clientId: appointment.clientId,
            type: "APPOINTMENT_CANCELLED",
            title: "Appointment Cancelled",
            description: `Cancelled appointment scheduled for ${appointment.scheduledStart.toLocaleDateString()}`,
            metadata: { appointmentId: id },
          },
        });
      }

      return NextResponse.json({
        success: true,
        appointment: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
