import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { domainErrorResponse, transitionAppointment } from "@/lib/appointments/service";

async function authenticatedClient() {
  const user = await getAuthenticatedUser();
  return user?.role === "CLIENT" && user.clientId ? user : null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const appointment = await prisma.appointment.findFirst({
    where: { id: (await params).id, clientId: user.clientId! },
    include: {
      location: { include: { business: { select: { name: true, phone: true } } } },
      services: { include: { service: { select: { id: true, name: true, duration: true, price: true } } } },
      staff: { select: { id: true, displayName: true, photo: true, user: { select: { firstName: true, lastName: true } } } },
    },
  });
  if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
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
      services: appointment.services.map(({ service }) => ({ ...service, price: Number(service.price) })),
      staff: {
        id: appointment.staff.id,
        displayName: appointment.staff.displayName || `${appointment.staff.user.firstName} ${appointment.staff.user.lastName}`.trim(),
        photo: appointment.staff.photo,
      },
      locationId: appointment.locationId,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { action?: unknown; reason?: unknown } | null;
  if (body?.action === "reschedule") {
    return NextResponse.json({ error: "RESCHEDULE_WORKFLOW_NOT_IMPLEMENTED" }, { status: 501 });
  }
  if (body?.action !== "cancel") return NextResponse.json({ error: "INVALID_ACTION" }, { status: 422 });
  try {
    const appointment = await transitionAppointment(
      prisma,
      user,
      (await params).id,
      "CANCELLED",
      typeof body.reason === "string" && body.reason.trim() ? body.reason : "Cancelled by client",
    );
    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    const known = domainErrorResponse(error);
    if (known) return NextResponse.json(known.body, { status: known.status });
    return NextResponse.json({ error: "APPOINTMENT_CANCEL_FAILED" }, { status: 500 });
  }
}
