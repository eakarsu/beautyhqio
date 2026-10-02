import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const updatePackageSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description: z.string().max(2000).optional().nullable(),
  price: z.coerce.number().finite().nonnegative().max(1_000_000).optional(),
  originalValue: z.coerce.number().finite().nonnegative().max(1_000_000).optional(),
  savingsAmount: z.coerce.number().finite().nonnegative().max(1_000_000).optional(),
  savingsPercent: z.coerce.number().finite().min(0).max(100).optional(),
  validityDays: z.coerce.number().int().min(1).max(3650).optional(),
  image: z.string().max(2000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/packages/[id] - Get package details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    const pkg = await prisma.package.findFirst({
      where: { id, businessId: ctx.businessId },
      include: {
        services: true,
        purchases: {
          include: {
            usages: true,
          },
          orderBy: { purchaseDate: "desc" },
          take: 10,
        },
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!pkg) return fail(404, "Package not found");

    return {
      ...pkg,
      price: Number(pkg.price),
      originalValue: Number(pkg.originalValue),
      savingsAmount: Number(pkg.savingsAmount),
      savingsPercent: Number(pkg.savingsPercent),
      purchases: pkg.purchases.map((p) => ({
        ...p,
        pricePaid: Number(p.pricePaid),
      })),
      totalPurchases: pkg._count.purchases,
    };
  });
}

// PUT /api/packages/[id] - Update package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;
    const input = updatePackageSchema.parse(await request.json());

    const existing = await prisma.package.findFirst({ where: { id, businessId: ctx.businessId }, select: { id: true } });
    if (!existing) return fail(404, "Package not found");

    const pkg = await prisma.package.update({
      where: { id },
      data: input,
    });

    return {
      ...pkg,
      price: Number(pkg.price),
      originalValue: Number(pkg.originalValue),
      savingsAmount: Number(pkg.savingsAmount),
      savingsPercent: Number(pkg.savingsPercent),
    };
  });
}

// DELETE /api/packages/[id] - Deactivate package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;

    const existing = await prisma.package.findFirst({ where: { id, businessId: ctx.businessId }, select: { id: true } });
    if (!existing) return fail(404, "Package not found");

    await prisma.package.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  });
}
