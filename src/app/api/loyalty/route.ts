import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const loyaltyUpdate = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  isActive: z.boolean().optional(),
  pointsPerDollar: z.coerce.number().finite().min(0).max(1000).optional(),
  bonusOnSignup: z.coerce.number().int().min(0).max(1_000_000).optional(),
  bonusOnBirthday: z.coerce.number().int().min(0).max(1_000_000).optional(),
  bonusOnReferral: z.coerce.number().int().min(0).max(1_000_000).optional(),
  tiers: z.unknown().optional().nullable(),
  pointsExpireMonths: z.coerce.number().int().min(0).max(1200).optional().nullable(),
});

// GET /api/loyalty - Get the caller's business loyalty program
export async function GET() {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);

    return prisma.loyaltyProgram.findUnique({
      where: { businessId: ctx.businessId },
      include: {
        rewards: {
          where: { isActive: true },
          orderBy: { pointsCost: "asc" },
        },
        accounts: {
          include: {
            client: true,
          },
          orderBy: {
            lifetimePoints: "desc",
          },
          take: 100,
        },
      },
    });
  });
}

// PUT /api/loyalty - Update the caller's business loyalty program
export async function PUT(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const input = loyaltyUpdate.parse(await request.json());

    const existing = await prisma.loyaltyProgram.findUnique({
      where: { businessId: ctx.businessId },
      select: { id: true },
    });
    if (!existing) return fail(404, "Loyalty program not found");

    return prisma.loyaltyProgram.update({
      where: { businessId: ctx.businessId },
      data: {
        ...input,
        tiers: (input.tiers ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      include: {
        rewards: true,
      },
    });
  });
}
