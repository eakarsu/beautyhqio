import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const addOnSchema = z.object({
  name: z.string().trim().min(1).max(150),
  price: z.coerce.number().finite().nonnegative().max(1_000_000),
  duration: z.coerce.number().int().min(0).max(1440).default(0),
});

// PUT /api/services/[id]/addons/[addonId] - Update an add-on
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id, addonId } = await params;
    const input = addOnSchema.parse(await request.json());

    const existing = await prisma.serviceAddOn.findFirst({
      where: { id: addonId, serviceId: id, service: { businessId: ctx.businessId } },
      select: { id: true },
    });
    if (!existing) return fail(404, "Add-on not found");

    return prisma.serviceAddOn.update({
      where: { id: addonId },
      data: {
        name: input.name,
        price: input.price,
        duration: input.duration,
      },
    });
  });
}

// DELETE /api/services/[id]/addons/[addonId] - Delete an add-on
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id, addonId } = await params;

    const existing = await prisma.serviceAddOn.findFirst({
      where: { id: addonId, serviceId: id, service: { businessId: ctx.businessId } },
      select: { id: true },
    });
    if (!existing) return fail(404, "Add-on not found");

    await prisma.serviceAddOn.delete({ where: { id: addonId } });

    return { success: true };
  });
}
