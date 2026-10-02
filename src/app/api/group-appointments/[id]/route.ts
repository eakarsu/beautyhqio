import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const updateGroupAppointmentSchema = z.object({
  name: z.string().trim().max(150).optional().nullable(),
  eventType: z.string().trim().max(40).optional(),
  scheduledStart: z.coerce.date().optional(),
  scheduledEnd: z.coerce.date().optional(),
  maxParticipants: z.coerce.number().int().min(1).max(500).optional(),
  minParticipants: z.coerce.number().int().min(1).max(500).optional(),
  pricePerPerson: z.coerce.number().finite().nonnegative().max(1_000_000).optional(),
  depositRequired: z.coerce.number().finite().nonnegative().max(1_000_000).optional().nullable(),
  status: z.string().trim().max(40).optional(),
  notes: z.string().max(2000).optional().nullable(),
  hostName: z.string().trim().max(150).optional().nullable(),
  hostPhone: z.string().trim().max(40).optional().nullable(),
  hostEmail: z.union([z.string().email().max(200), z.literal("")]).optional().nullable(),
  serviceId: idSchema.optional().nullable(),
});

// GET /api/group-appointments/[id] - Get group appointment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    // GroupAppointment has no businessId column and no Location relation, so the
    // tenant filter is expressed through the tenant's location ids.
    const locationIds = (await prisma.location.findMany({ where: { businessId: ctx.businessId }, select: { id: true } })).map((l) => l.id);

    const appointment = await prisma.groupAppointment.findFirst({
      where: { id, locationId: { in: locationIds } },
      include: {
        participants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!appointment) return fail(404, "Group appointment not found");

    return {
      ...appointment,
      pricePerPerson: Number(appointment.pricePerPerson),
      depositRequired: appointment.depositRequired ? Number(appointment.depositRequired) : null,
      participants: appointment.participants.map((p) => ({
        ...p,
        paidAmount: p.paidAmount ? Number(p.paidAmount) : null,
      })),
      participantCount: appointment.participants.length,
      spotsAvailable: appointment.maxParticipants - appointment.participants.length,
      totalRevenue: appointment.participants.reduce(
        (sum, p) => sum + (p.paidAmount ? Number(p.paidAmount) : 0),
        0
      ),
    };
  });
}

// PUT /api/group-appointments/[id] - Update group appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const input = updateGroupAppointmentSchema.parse(await request.json());

    const existing = await prisma.groupAppointment.findFirst({
      where: { id, locationId: { in: (await prisma.location.findMany({ where: { businessId: ctx.businessId }, select: { id: true } })).map((l) => l.id) } },
      select: { id: true },
    });
    if (!existing) return fail(404, "Group appointment not found");
    if (input.serviceId && !(await prisma.service.findFirst({ where: { id: input.serviceId, businessId: ctx.businessId }, select: { id: true } }))) {
      return fail(404, "Service not found");
    }

    const appointment = await prisma.groupAppointment.update({
      where: { id },
      data: input,
      include: {
        participants: true,
      },
    });

    return {
      ...appointment,
      pricePerPerson: Number(appointment.pricePerPerson),
      depositRequired: appointment.depositRequired ? Number(appointment.depositRequired) : null,
    };
  });
}

// DELETE /api/group-appointments/[id] - Cancel group appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;

    const existing = await prisma.groupAppointment.findFirst({
      where: { id, locationId: { in: (await prisma.location.findMany({ where: { businessId: ctx.businessId }, select: { id: true } })).map((l) => l.id) } },
      select: { id: true },
    });
    if (!existing) return fail(404, "Group appointment not found");

    await prisma.groupAppointment.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return { success: true };
  });
}
