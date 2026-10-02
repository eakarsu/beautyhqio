import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const updateRewardSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description: z.string().max(1000).optional().nullable(),
  pointsCost: z.coerce.number().int().positive().max(1_000_000).optional(),
  type: z.string().trim().max(40).optional(),
  value: z.coerce.number().finite().nonnegative().max(100_000).optional(),
  image: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/loyalty/rewards/[id] - Get reward details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF", "CLIENT"]);
    const { id } = await params;

    const reward = await prisma.loyaltyReward.findFirst({
      where: { id, program: { businessId: ctx.businessId } },
    });

    return reward || fail(404, "Reward not found");
  });
}

// PUT /api/loyalty/rewards/[id] - Update reward
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;
    const input = updateRewardSchema.parse(await request.json());

    const existing = await prisma.loyaltyReward.findFirst({ where: { id, program: { businessId: ctx.businessId } }, select: { id: true } });
    if (!existing) return fail(404, "Reward not found");

    return prisma.loyaltyReward.update({ where: { id }, data: input });
  });
}

// DELETE /api/loyalty/rewards/[id] - Delete reward
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;

    const existing = await prisma.loyaltyReward.findFirst({ where: { id, program: { businessId: ctx.businessId } }, select: { id: true } });
    if (!existing) return fail(404, "Reward not found");

    await prisma.loyaltyReward.delete({ where: { id } });

    return { success: true };
  });
}
