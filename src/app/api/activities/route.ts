import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const activityTypes = [
  "APPOINTMENT_BOOKED",
  "APPOINTMENT_COMPLETED",
  "APPOINTMENT_CANCELLED",
  "APPOINTMENT_RESCHEDULED",
  "APPOINTMENT_NO_SHOW",
  "PURCHASE",
  "LOYALTY_EARNED",
  "LOYALTY_REDEEMED",
  "EMAIL_SENT",
  "SMS_SENT",
  "CALL_LOGGED",
  "NOTE_ADDED",
  "PHOTO_ADDED",
  "REVIEW_RECEIVED",
  "PROFILE_UPDATED",
  "REFERRAL_MADE",
  "GIFT_CARD_PURCHASED",
  "GIFT_CARD_REDEEMED",
] as const;

const activityTypeSchema = z.enum(activityTypes);

export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const typeParam = searchParams.get("type");
    const limit = z.coerce.number().int().min(1).max(200).parse(searchParams.get("limit") || 50);
    const offset = z.coerce.number().int().min(0).max(1000000).parse(searchParams.get("offset") || 0);
    const type = typeParam ? activityTypeSchema.parse(typeParam) : undefined;

    const where: Prisma.ActivityWhereInput = {
      client: { businessId: ctx.businessId },
      ...(clientId && { clientId }),
      ...(type && { type }),
    };

    const activities = await prisma.activity.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.activity.count({ where });

    return {
      activities,
      total,
      hasMore: offset + limit < total,
    };
  });
}

export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const body = z
      .object({
        clientId: idSchema,
        type: activityTypeSchema,
        title: z.string().trim().min(1).max(200),
        description: z.string().max(2000).optional().nullable(),
        metadata: z.unknown().optional(),
      })
      .parse(await request.json());

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!client) fail(404, "Client not found");

    return prisma.activity.create({
      data: {
        clientId: body.clientId,
        userId: ctx.user.id,
        type: body.type,
        title: body.title,
        description: body.description ?? null,
        metadata: (body.metadata ?? {}) as Prisma.InputJsonValue,
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  });
}
