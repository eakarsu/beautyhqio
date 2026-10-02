import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const participantSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.union([z.string().email().max(200), z.literal("")]).optional().nullable(),
  clientId: idSchema.optional().nullable(),
});

const createGroupAppointmentSchema = z.object({
  name: z.string().trim().max(150).optional().nullable(),
  eventType: z.string().trim().max(40).default("group"),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
  staffId: idSchema,
  locationId: idSchema,
  serviceId: idSchema.optional().nullable(),
  maxParticipants: z.coerce.number().int().min(1).max(500).default(10),
  minParticipants: z.coerce.number().int().min(1).max(500).default(2),
  pricePerPerson: z.coerce.number().finite().nonnegative().max(1_000_000),
  depositRequired: z.coerce.number().finite().nonnegative().max(1_000_000).optional().nullable(),
  hostName: z.string().trim().max(150).optional().nullable(),
  hostPhone: z.string().trim().max(40).optional().nullable(),
  hostEmail: z.union([z.string().email().max(200), z.literal("")]).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  participants: z.array(participantSchema).max(500).default([]),
});

// GET /api/group-appointments - List group appointments
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const eventType = searchParams.get("eventType");
    const take = z.coerce.number().int().min(1).max(200).parse(searchParams.get("limit") || 200);

    // GroupAppointment has no businessId column and no Location relation in the
    // data model, so the tenant filter is expressed through the tenant's location ids.
    const locationIds = (await prisma.location.findMany({ where: { businessId: ctx.businessId }, select: { id: true } })).map((l) => l.id);

    const appointments = await prisma.groupAppointment.findMany({
      where: {
        locationId: { in: locationIds },
        ...(status ? { status } : {}),
        ...(eventType ? { eventType } : {}),
        ...(startDate || endDate
          ? {
              scheduledStart: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        participants: true,
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { scheduledStart: "asc" },
      take,
    });

    return appointments.map((apt) => ({
      ...apt,
      pricePerPerson: Number(apt.pricePerPerson),
      depositRequired: apt.depositRequired ? Number(apt.depositRequired) : null,
      participantCount: apt._count.participants,
      spotsAvailable: apt.maxParticipants - apt._count.participants,
      participants: apt.participants.map((p) => ({
        ...p,
        paidAmount: p.paidAmount ? Number(p.paidAmount) : null,
      })),
    }));
  });
}

// POST /api/group-appointments - Create a new group appointment
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const input = createGroupAppointmentSchema.parse(await request.json());

    const [location, staff] = await Promise.all([
      prisma.location.findFirst({ where: { id: input.locationId, businessId: ctx.businessId }, select: { id: true } }),
      prisma.staff.findFirst({ where: { id: input.staffId, location: { businessId: ctx.businessId } }, select: { id: true } }),
    ]);
    if (!location) return fail(404, "Location not found");
    if (!staff) return fail(404, "Staff not found");
    if (input.serviceId && !(await prisma.service.findFirst({ where: { id: input.serviceId, businessId: ctx.businessId }, select: { id: true } }))) {
      return fail(404, "Service not found");
    }
    for (const participant of input.participants) {
      if (participant.clientId && !(await prisma.client.findFirst({ where: { id: participant.clientId, businessId: ctx.businessId }, select: { id: true } }))) {
        return fail(404, "Participant client not found");
      }
    }

    const groupAppointment = await prisma.groupAppointment.create({
      data: {
        name: input.name,
        eventType: input.eventType,
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        staffId: input.staffId,
        locationId: input.locationId,
        serviceId: input.serviceId,
        maxParticipants: input.maxParticipants,
        minParticipants: input.minParticipants,
        pricePerPerson: input.pricePerPerson,
        depositRequired: input.depositRequired,
        hostName: input.hostName,
        hostPhone: input.hostPhone,
        hostEmail: input.hostEmail,
        notes: input.notes,
        participants: input.participants.length
          ? {
              create: input.participants.map((p) => ({
                name: p.name,
                phone: p.phone,
                email: p.email,
                clientId: p.clientId,
              })),
            }
          : undefined,
      },
      include: {
        participants: true,
      },
    });

    return {
      ...groupAppointment,
      pricePerPerson: Number(groupAppointment.pricePerPerson),
      depositRequired: groupAppointment.depositRequired ? Number(groupAppointment.depositRequired) : null,
    };
  });
}
