import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const updateMembershipSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description: z.string().max(2000).optional().nullable(),
  price: z.coerce.number().finite().nonnegative().max(1_000_000).optional(),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]).optional(),
  discountPercent: z.coerce.number().finite().min(0).max(100).optional(),
  freeServicesPerMonth: z.coerce.number().int().min(0).max(1000).optional(),
  priorityBooking: z.boolean().optional(),
  guestPasses: z.coerce.number().int().min(0).max(1000).optional(),
  includedServices: z.any().optional().nullable(),
  image: z.string().max(2000).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/memberships/[id] - Get membership plan details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    const membership = await prisma.membership.findFirst({
      where: { id, businessId: ctx.businessId },
      include: {
        subscriptions: {
          where: { status: "active" },
          orderBy: { startDate: "desc" },
          take: 10,
        },
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!membership) return fail(404, "Membership not found");

    return {
      ...membership,
      price: Number(membership.price),
      discountPercent: Number(membership.discountPercent),
      subscriptions: membership.subscriptions.map((s) => ({
        ...s,
        lastPaymentAmount: s.lastPaymentAmount ? Number(s.lastPaymentAmount) : null,
      })),
      totalSubscribers: membership._count.subscriptions,
    };
  });
}

// PUT /api/memberships/[id] - Update membership plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;
    const input = updateMembershipSchema.parse(await request.json());

    const existing = await prisma.membership.findFirst({ where: { id, businessId: ctx.businessId }, select: { id: true } });
    if (!existing) return fail(404, "Membership not found");

    const membership = await prisma.membership.update({
      where: { id },
      data: input,
    });

    return {
      ...membership,
      price: Number(membership.price),
      discountPercent: Number(membership.discountPercent),
    };
  });
}

// DELETE /api/memberships/[id] - Deactivate membership plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;

    const existing = await prisma.membership.findFirst({ where: { id, businessId: ctx.businessId }, select: { id: true } });
    if (!existing) return fail(404, "Membership not found");

    await prisma.membership.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  });
}
