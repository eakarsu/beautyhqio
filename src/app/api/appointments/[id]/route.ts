import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { domainErrorResponse, transitionAppointment } from "@/lib/appointments/service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({ where: { id }, include: { client: true, staff: { include: { user: true } }, location: true, services: { include: { service: true, addOns: { include: { addOn: true } } } }, photos: true, transaction: true } });
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowed = user.isPlatformAdmin || (user.role === "CLIENT" ? user.clientId === appointment.clientId : user.businessId === (appointment.businessId || appointment.location.businessId) && (user.role !== "STAFF" || user.staffId === appointment.staffId));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(appointment);
}

export async function PUT() {
  return NextResponse.json({ error: "ARBITRARY_UPDATE_REMOVED", message: "Use explicit lifecycle endpoints." }, { status: 405, headers: { Allow: "GET,DELETE" } });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const appointment = await transitionAppointment(prisma, user, id, "CANCELLED", String(body.reason || "Cancelled by authorized operator"));
    return NextResponse.json(appointment);
  } catch (error) {
    const known = domainErrorResponse(error);
    if (known) return NextResponse.json(known.body, { status: known.status });
    return NextResponse.json({ error: "APPOINTMENT_CANCEL_FAILED" }, { status: 500 });
  }
}
