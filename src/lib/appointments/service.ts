import { createHash } from "node:crypto";
import { publicUserSelect } from "@/lib/public-user";
import { Prisma, PrismaClient } from "@prisma/client";
import type { AuthenticatedUser } from "@/lib/api-auth";
import {
  AppointmentDomainError,
  appointmentStatusSchema,
  assertTransition,
  createAppointmentSchema,
  parseIdempotencyKey,
  type AppointmentStatus,
} from "./domain";

import { assertAvailable } from "./availability";

const MANAGER_ROLES = new Set(["OWNER", "MANAGER", "RECEPTIONIST"]);

async function assertBusinessAccess(user: AuthenticatedUser, businessId: string) {
  if (!user.isPlatformAdmin && user.businessId !== businessId && user.role !== "CLIENT") {
    throw new AppointmentDomainError("TENANT_MISMATCH", 403, "resource belongs to another business");
  }
}

export async function createAppointment(
  db: PrismaClient,
  user: AuthenticatedUser,
  raw: unknown,
  rawIdempotencyKey: string | null,
  transaction?: Prisma.TransactionClient,
) {
  const parsed = createAppointmentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppointmentDomainError("INVALID_REQUEST", 422, parsed.error.issues[0]?.message || "invalid appointment");
  }
  const input = parsed.data;
  const idempotencyKey = parseIdempotencyKey(rawIdempotencyKey);
  const location = await (transaction || db).location.findUnique({ where: { id: input.locationId } });
  if (!location || !location.isActive) throw new AppointmentDomainError("LOCATION_NOT_FOUND", 404, "active location not found");
  await assertBusinessAccess(user, location.businessId);

  if (user.role === "CLIENT" && (!user.clientId || (input.clientId && input.clientId !== user.clientId))) {
    throw new AppointmentDomainError("CLIENT_MISMATCH", 403, "clients may book only for their own profile");
  }
  if (user.role !== "CLIENT" && !user.isPlatformAdmin && !MANAGER_ROLES.has(user.role)) {
    throw new AppointmentDomainError("ROLE_FORBIDDEN", 403, "role cannot create appointments");
  }

  const requestHash = createHash("sha256").update(JSON.stringify({ ...input, clientId: input.clientId || user.clientId || null })).digest("hex");
  const work = async (tx: Prisma.TransactionClient) => {
    // Serialize governed creates in a tenant, including retries with the same key.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${location.businessId}, 0))::text`;
    const existing = await tx.appointment.findUnique({
      where: { businessId_idempotencyKey: { businessId: location.businessId, idempotencyKey } },
      include: { services: { include: { service: true } }, client: true, staff: { include: { user: { select: publicUserSelect } } }, location: true },
    });
    if (existing) {
      if (user.role === "CLIENT" && existing.clientId !== user.clientId) {
        throw new AppointmentDomainError("CLIENT_MISMATCH", 403, "clients may access only their own appointments");
      }
      if (existing.requestHash !== requestHash) throw new AppointmentDomainError("IDEMPOTENCY_CONFLICT", 409, "idempotency key was used for a different request");
      return { appointment: existing, replayed: true };
    }

    const requestedServiceIds = input.services?.map((line) => line.serviceId) || input.serviceIds || [];
    const [staff, services, client] = await Promise.all([
      tx.staff.findUnique({ where: { id: input.staffId }, include: { user: { select: publicUserSelect }, location: true } }),
      tx.service.findMany({ where: { id: { in: requestedServiceIds }, businessId: location.businessId, isActive: true } }),
      (input.clientId || user.clientId) ? tx.client.findUnique({ where: { id: (input.clientId || user.clientId)! } }) : Promise.resolve(null),
    ]);
    if (!staff || staff.location.businessId !== location.businessId || staff.locationId !== location.id || !staff.isActive) {
      throw new AppointmentDomainError("STAFF_NOT_FOUND", 404, "active staff member not found in this business");
    }
    if (services.length !== new Set(requestedServiceIds).size) {
      throw new AppointmentDomainError("SERVICE_MISMATCH", 422, "one or more services are unavailable for this business");
    }
    if ((input.clientId || user.clientId) && !client) throw new AppointmentDomainError("CLIENT_NOT_FOUND", 404, "client not found");
    if (client && client.businessId !== location.businessId) {
      throw new AppointmentDomainError("CLIENT_MISMATCH", 403, "client belongs to another business");
    }
    if (user.role === "CLIENT" && (input.scheduledEnd || input.services?.some(line => line.price !== undefined || line.duration !== undefined))) {
      throw new AppointmentDomainError("PRICE_OVERRIDE_FORBIDDEN", 403, "Clients cannot override service prices or durations");
    }
    if (user.role === "CLIENT" && (!location.allowOnlineBooking || services.some(service => !service.allowOnline))) throw new AppointmentDomainError("ONLINE_BOOKING_DISABLED", 409, "One or more services cannot be booked online");
    if (user.role === "CLIENT" && (input.scheduledStart <= new Date() || input.scheduledStart.getTime() > Date.now() + location.advanceBookingDays * 86400000)) throw new AppointmentDomainError("BOOKING_WINDOW", 422, "Choose a future time within the booking window");
    if (staff.serviceIds.length && requestedServiceIds.some(id => !staff.serviceIds.includes(id))) throw new AppointmentDomainError("STAFF_SERVICE_MISMATCH", 422, "Staff member does not provide all selected services");
    const lineByService = new Map((input.services || []).map((line) => [line.serviceId, line]));
    const totalDuration = services.reduce((sum, service) => sum + (lineByService.get(service.id)?.duration ?? service.duration), 0);
    const scheduledEnd = input.scheduledEnd || new Date(input.scheduledStart.getTime() + totalDuration * 60_000);
    if (scheduledEnd.getTime() - input.scheduledStart.getTime() < totalDuration * 60000) throw new AppointmentDomainError("INVALID_TIME", 422, "Appointment must include the full duration of its services");
    await assertAvailable(tx, { businessId: location.businessId, locationId: location.id, staffId: staff.id, start: input.scheduledStart, end: scheduledEnd, buffer: Math.max(0, ...services.map(s => (s.bufferTime || 0))) });

    const appointment = await tx.appointment.create({
      data: {
        businessId: location.businessId,
        idempotencyKey,
        requestHash,
        clientId: client?.id,
        staffId: staff.id,
        locationId: location.id,
        scheduledStart: input.scheduledStart,
        scheduledEnd,
        notes: input.notes,
        source: input.source,
        services: {
          create: services.map((service) => ({
            serviceId: service.id,
            price: lineByService.get(service.id)?.price ?? service.price,
            duration: lineByService.get(service.id)?.duration ?? service.duration,
          })),
        },
      },
      include: { services: { include: { service: true } }, client: true, staff: { include: { user: { select: publicUserSelect } } }, location: true },
    });
    if (client) {
      await tx.activity.create({ data: { clientId: client.id, userId: user.id, type: "APPOINTMENT_BOOKED", title: "Appointment Booked", metadata: { appointmentId: appointment.id } } });
    }
    await tx.auditLog.create({ data: { userId: user.id, businessId: location.businessId, action: "APPOINTMENT_CREATED", entityType: "Appointment", entityId: appointment.id, changes: { status: "BOOKED", scheduledStart: appointment.scheduledStart.toISOString(), scheduledEnd: appointment.scheduledEnd.toISOString() } } });
    const deliveries = [
      ["CALENDAR_CREATE", "calendar"],
      ...(client?.email && client.allowEmail !== false ? [["CONFIRMATION_EMAIL", "email"]] : []),
      ...(client?.phone && client.allowSms !== false ? [["CONFIRMATION_SMS", "twilio"]] : []),
    ];
    await tx.integrationDelivery.createMany({
      data: deliveries.map(([kind, provider]) => ({ businessId: location.businessId, appointmentId: appointment.id, kind, provider, dedupeKey: `${appointment.id}:${kind}`, payload: { appointmentId: appointment.id } })),
    });
    return { appointment, replayed: false };
  };
  return transaction ? work(transaction) : db.$transaction(work);
}

export async function transitionAppointment(
  db: PrismaClient,
  user: AuthenticatedUser,
  id: string,
  targetRaw: string,
  reason?: string,
) {
  const target = appointmentStatusSchema.parse(targetRaw) as AppointmentStatus;
  const current = await db.appointment.findUnique({ where: { id }, include: { client: true, staff: { include: { location: true } }, location: true } });
  if (!current) throw new AppointmentDomainError("NOT_FOUND", 404, "appointment not found");
  const businessId = current.businessId || current.location.businessId;
  await assertBusinessAccess(user, businessId);
  if (user.role === "CLIENT") {
    if (target === "CHECKED_IN" && Math.abs(current.scheduledStart.getTime() - Date.now()) > 2 * 3600000) throw new AppointmentDomainError("CHECK_IN_WINDOW", 409, "Self check-in is available within two hours of the appointment");
    if (!user.clientId || current.clientId !== user.clientId || !["CANCELLED", "CHECKED_IN"].includes(target)) throw new AppointmentDomainError("ROLE_FORBIDDEN", 403, "client cannot perform this transition");
  } else if (user.role === "STAFF" && (current.staffId !== user.staffId || !["CHECKED_IN", "IN_SERVICE", "COMPLETED"].includes(target))) {
    throw new AppointmentDomainError("ROLE_FORBIDDEN", 403, "staff member cannot perform this transition");
  } else if (!user.isPlatformAdmin && !MANAGER_ROLES.has(user.role) && user.role !== "STAFF") {
    throw new AppointmentDomainError("ROLE_FORBIDDEN", 403, "role cannot update appointments");
  }
  const from = appointmentStatusSchema.parse(current.status) as AppointmentStatus;
  assertTransition(from, target);
  if (target === "CANCELLED" && !reason?.trim()) throw new AppointmentDomainError("REASON_REQUIRED", 422, "cancellation reason is required");
  const now = new Date();
  return db.$transaction(async (tx) => {
    const updated = await tx.appointment.updateMany({
      where: { id, version: current.version, status: current.status },
      data: {
        status: target,
        version: { increment: 1 },
        checkedInAt: target === "CHECKED_IN" ? now : undefined,
        isConfirmed: target === "CONFIRMED" ? true : undefined,
        confirmedAt: target === "CONFIRMED" ? now : undefined,
        actualStart: target === "IN_SERVICE" ? now : undefined,
        actualEnd: target === "COMPLETED" ? now : undefined,
        checkedOutAt: target === "COMPLETED" ? now : undefined,
        internalNotes: reason?.trim() || undefined,
      },
    });
    if (updated.count !== 1) throw new AppointmentDomainError("STALE_WRITE", 409, "appointment changed; refresh and retry");
    if (["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(target)) await tx.roomReservation.deleteMany({ where: { appointmentId: id } });
    await tx.auditLog.create({ data: { userId: user.id, businessId, action: `APPOINTMENT_${target}`, entityType: "Appointment", entityId: id, changes: { from, to: target, reason: reason?.trim() } } });
    if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(target) && current.clientId) {
      const activityType = target === "CANCELLED" ? "APPOINTMENT_CANCELLED" : target === "COMPLETED" ? "APPOINTMENT_COMPLETED" : "APPOINTMENT_NO_SHOW";
      await tx.activity.create({ data: { clientId: current.clientId, userId: user.id, type: activityType, title: target.replace("_", " "), metadata: { appointmentId: id, reason: reason?.trim() } } });
    }
    await tx.integrationDelivery.create({ data: { businessId, appointmentId: id, kind: "CALENDAR_UPDATE", provider: "calendar", dedupeKey: `${id}:CALENDAR_UPDATE:${current.version + 1}`, payload: { appointmentId: id, target } } });
    return tx.appointment.findUniqueOrThrow({ where: { id }, include: { client: true, staff: { include: { user: { select: publicUserSelect } } }, location: true, services: { include: { service: true } } } });
  });
}

export function domainErrorResponse(error: unknown) {
  if (error instanceof AppointmentDomainError) return { status: error.status, body: { error: error.code, message: error.message } };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: 409, body: { error: "CONFLICT", message: "request conflicts with an existing record" } };
  const overlapViolation = error instanceof Prisma.PrismaClientUnknownRequestError
    ? error.message.includes("Appointment_staff_no_overlap") && error.message.includes("23P01")
    : error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2004" || error.code === "P2010") && /Appointment_staff_no_overlap/.test(JSON.stringify(error.meta));
  if (overlapViolation) {
    return { status: 409, body: { error: "STAFF_CONFLICT", message: "staff member already has an overlapping appointment" } };
  }
  return null;
}
