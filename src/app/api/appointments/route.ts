import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { appointmentStatusSchema } from "@/lib/appointments/domain";
import { createAppointment, domainErrorResponse } from "@/lib/appointments/service";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const where: Record<string, unknown> = {};
  const status = url.searchParams.get("status");
  if (status) {
    const parsed = appointmentStatusSchema.safeParse(status);
    if (!parsed.success) return NextResponse.json({ error: "INVALID_STATUS" }, { status: 422 });
    where.status = parsed.data;
  }
  const date = url.searchParams.get("date");
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "INVALID_DATE" }, { status: 422 });
    where.scheduledStart = { gte: new Date(`${date}T00:00:00.000Z`), lte: new Date(`${date}T23:59:59.999Z`) };
  }
  if (user.role === "CLIENT") {
    if (!user.clientId) return NextResponse.json([]);
    where.clientId = user.clientId;
  } else if (!user.isPlatformAdmin) {
    if (!user.businessId) return NextResponse.json({ error: "TENANT_REQUIRED" }, { status: 403 });
    where.businessId = user.businessId;
    if (user.role === "STAFF") where.staffId = user.staffId || "__none__";
  }
  const requestedLocation = url.searchParams.get("locationId");
  if (requestedLocation) {
    const allowed = user.isPlatformAdmin || await prisma.location.count({ where: { id: requestedLocation, ...(user.role === "CLIENT" ? {} : { businessId: user.businessId! }) } });
    if (!allowed) return NextResponse.json({ error: "TENANT_MISMATCH" }, { status: 403 });
    where.locationId = requestedLocation;
  }
  const requestedStaff = url.searchParams.get("staffId");
  if (requestedStaff && user.role !== "STAFF") where.staffId = requestedStaff;
  const appointments = await prisma.appointment.findMany({
    where,
    include: { client: true, staff: { include: { user: true } }, location: true, services: { include: { service: true, addOns: { include: { addOn: true } } } } },
    orderBy: { scheduledStart: "asc" },
    take: 100,
  });
  return NextResponse.json(appointments);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await createAppointment(prisma, user, await request.json().catch(() => null), request.headers.get("idempotency-key"));
    return NextResponse.json(result.appointment, {
      status: result.replayed ? 200 : 201,
      headers: { "Idempotency-Replayed": result.replayed ? "true" : "false" },
    });
  } catch (error) {
    const known = domainErrorResponse(error);
    if (known) return NextResponse.json(known.body, { status: known.status });
    console.error("Appointment creation failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "APPOINTMENT_CREATE_FAILED" }, { status: 500 });
  }
}
