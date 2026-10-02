import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const updateGiftCardSchema = z.object({
  status: z.enum(["active", "redeemed", "expired", "cancelled"]).optional(),
  currentBalance: z.coerce.number().finite().nonnegative().max(1_000_000).optional(),
  recipientEmail: z.union([z.string().email().max(200), z.literal("")]).nullable().optional(),
  recipientName: z.string().trim().max(150).nullable().optional(),
  message: z.string().max(1000).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

// GET /api/gift-cards/[id] - Get gift card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    const giftCard = await prisma.giftCard.findFirst({
      where: { id, businessId: ctx.businessId },
      include: {
        purchasedBy: true,
        owner: true,
        usageHistory: {
          orderBy: { usedAt: "desc" },
        },
      },
    });

    return giftCard || fail(404, "Gift card not found");
  });
}

// PUT /api/gift-cards/[id] - Update gift card
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const input = updateGiftCardSchema.parse(await request.json());

    const existing = await prisma.giftCard.findFirst({ where: { id, businessId: ctx.businessId } });
    if (!existing) return fail(404, "Gift card not found");

    return prisma.giftCard.update({ where: { id }, data: input });
  });
}

// DELETE /api/gift-cards/[id] - Delete gift card
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;

    const existing = await prisma.giftCard.findFirst({ where: { id, businessId: ctx.businessId } });
    if (!existing) return fail(404, "Gift card not found");

    await prisma.$transaction([
      prisma.giftCardUsage.deleteMany({ where: { giftCardId: id } }),
      prisma.giftCard.delete({ where: { id } }),
    ]);

    return { success: true };
  });
}
