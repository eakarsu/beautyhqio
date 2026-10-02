import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { context, endpoint } from "@/lib/operations/core";

const membershipInput = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().max(2000).optional().nullable(),
  price: z.coerce.number().finite().nonnegative().max(1_000_000),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]).optional().default("monthly"),
  discountPercent: z.coerce.number().finite().min(0).max(100).optional().default(0),
  freeServicesPerMonth: z.coerce.number().int().min(0).max(1000).optional().default(0),
  priorityBooking: z.boolean().optional().default(false),
  guestPasses: z.coerce.number().int().min(0).max(1000).optional().default(0),
  includedServices: z.unknown().optional().nullable(),
  image: z.string().max(2000).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  isPopular: z.boolean().optional().default(false),
});

// GET /api/memberships - List membership plans for the caller's business
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";

    const memberships = await prisma.membership.findMany({
      where: {
        businessId: ctx.businessId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }],
    });

    return memberships.map((m) => ({
      ...m,
      price: Number(m.price),
      discountPercent: Number(m.discountPercent),
      subscriberCount: m._count.subscriptions,
    }));
  });
}

// POST /api/memberships - Create a membership plan in the caller's business
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const input = membershipInput.parse(await request.json());

    const membership = await prisma.membership.create({
      data: {
        ...input,
        businessId: ctx.businessId,
        includedServices: (input.includedServices ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      } as Prisma.MembershipUncheckedCreateInput,
    });

    return {
      ...membership,
      price: Number(membership.price),
      discountPercent: Number(membership.discountPercent),
    };
  });
}
