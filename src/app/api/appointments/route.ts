import { appointmentListRange } from "@/lib/appointments/list-range";
import { publicUserSelect } from "@/lib/public-user";
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
  try {
    const range = appointmentListRange(url.searchParams);
    if (range) where.scheduledStart = range;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 422 });
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
    include: { client: true, staff: { include: { user: { select: publicUserSelect } } }, location: true, services: { include: { service: true, addOns: { include: { addOn: true } } } } },
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
