import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/staff/me/clients/[clientId] - Get client details for staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await params;

    // Find staff record for current user
    const staff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        tags: true,
        notes: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get completed appointments with this staff member
    const appointments = await prisma.appointment.findMany({
      where: {
        staffId: staff.id,
        clientId: clientId,
        status: "COMPLETED",
      },
      include: {
        services: {
          include: {
            service: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { scheduledStart: "desc" },
      take: 10,
    });

    // Calculate total spent with this staff member
    const totalSpent = appointments.reduce((sum, apt) => {
      const aptTotal = apt.services.reduce((s, svc) => s + Number(svc.price), 0);
      return sum + aptTotal;
    }, 0);

    // Format appointments for response
    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      date: apt.scheduledStart.toISOString(),
      services: apt.services.map((s) => s.service?.name || "Service").filter(Boolean),
      total: apt.services.reduce((s, svc) => s + Number(svc.price), 0),
    }));

    return NextResponse.json({
      ...client,
      totalSpent,
      appointments: formattedAppointments,
    });
  } catch (error) {
    console.error("Error fetching client details:", error);
    return NextResponse.json(
      { error: "Failed to fetch client details" },
      { status: 500 }
    );
  }
}
