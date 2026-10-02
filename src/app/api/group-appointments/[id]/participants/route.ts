import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const addParticipantSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.union([z.string().email().max(200), z.literal("")]).optional().nullable(),
  clientId: idSchema.optional().nullable(),
  paidAmount: z.coerce.number().finite().nonnegative().max(1_000_000).optional().nullable(),
});

const updateParticipantSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.union([z.string().email().max(200), z.literal("")]).optional().nullable(),
  status: z.string().trim().max(40).optional(),
  checkedIn: z.boolean().optional(),
  paidAmount: z.coerce.number().finite().nonnegative().max(1_000_000).optional().nullable(),
});

async function tenantLocationIds(businessId: string) {
  return (await prisma.location.findMany({ where: { businessId }, select: { id: true } })).map((l) => l.id);
}

async function assertAppointment(ctx: { businessId: string }, id: string) {
  // GroupAppointment has no businessId column and no Location relation, so the
  // tenant filter is expressed through the tenant's location ids.
  const locationIds = await tenantLocationIds(ctx.businessId);
  const appointment = await prisma.groupAppointment.findFirst({
    where: { id, locationId: { in: locationIds } },
    select: { id: true, maxParticipants: true, minParticipants: true, status: true, _count: { select: { participants: true } } },
  });
  if (!appointment) return fail(404, "Group appointment not found");
  return appointment;
}

// POST /api/group-appointments/[id]/participants - Add participant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const input = addParticipantSchema.parse(await request.json());

    const appointment = await assertAppointment(ctx, id);

    if (appointment._count.participants >= appointment.maxParticipants) {
      return fail(400, "Group appointment is full");
    }

    if (input.clientId && !(await prisma.client.findFirst({ where: { id: input.clientId, businessId: ctx.businessId }, select: { id: true } }))) {
      return fail(404, "Client not found");
    }

    const participant = await prisma.groupParticipant.create({
      data: {
        groupAppointmentId: id,
        name: input.name,
        phone: input.phone,
        email: input.email,
        clientId: input.clientId,
        paidAmount: input.paidAmount,
      },
    });

    // Update status if min participants reached
    const newCount = appointment._count.participants + 1;
    if (newCount >= appointment.minParticipants && appointment.status === "pending") {
      await prisma.groupAppointment.update({
        where: { id },
        data: { status: "confirmed" },
      });
    }

    return {
      ...participant,
      paidAmount: participant.paidAmount ? Number(participant.paidAmount) : null,
    };
  });
}

// DELETE /api/group-appointments/[id]/participants?participantId=... - Remove participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const participantId = new URL(request.url).searchParams.get("participantId");
    if (!participantId) return fail(400, "participantId is required");

    const participant = await prisma.groupParticipant.findFirst({
      where: { id: participantId, groupAppointment: { id, locationId: { in: await tenantLocationIds(ctx.businessId) } } },
      select: { id: true },
    });
    if (!participant) return fail(404, "Participant not found");

    await prisma.groupParticipant.delete({ where: { id: participantId } });

    return { success: true };
  });
}

// PATCH /api/group-appointments/[id]/participants - Update participant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const body = await request.json();
    const participantId = idSchema.parse((body as { participantId?: unknown }).participantId);
    const updates = updateParticipantSchema.parse(body);

    const participant = await prisma.groupParticipant.findFirst({
      where: { id: participantId, groupAppointment: { id, locationId: { in: await tenantLocationIds(ctx.businessId) } } },
      select: { id: true },
    });
    if (!participant) return fail(404, "Participant not found");

    const updated = await prisma.groupParticipant.update({
      where: { id: participantId },
      data: updates,
    });

    return {
      ...updated,
      paidAmount: updated.paidAmount ? Number(updated.paidAmount) : null,
    };
  });
}
