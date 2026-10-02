import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const packageInput = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().max(2000).optional().nullable(),
  price: z.coerce.number().finite().nonnegative().max(1_000_000),
  services: z
    .array(
      z.object({
        serviceId: z.string().trim().min(1).max(191),
        quantity: z.coerce.number().int().min(1).max(1000).optional().default(1),
      })
    )
    .min(1),
  validityDays: z.coerce.number().int().min(1).max(3650).optional().default(365),
  image: z.string().max(2000).optional().nullable(),
  isPopular: z.boolean().optional().default(false),
});

// GET /api/packages - List packages for the caller's business
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";

    const packages = await prisma.package.findMany({
      where: {
        businessId: ctx.businessId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        services: true,
        _count: {
          select: { purchases: true },
        },
      },
      orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }],
    });

    return packages.map((p) => ({
      ...p,
      price: Number(p.price),
      originalValue: Number(p.originalValue),
      savingsAmount: Number(p.savingsAmount),
      savingsPercent: Number(p.savingsPercent),
      purchaseCount: p._count.purchases,
    }));
  });
}

// POST /api/packages - Create a package in the caller's business
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const input = packageInput.parse(await request.json());

    // Verify every referenced service belongs to the caller's business.
    const serviceData = await prisma.service.findMany({
      where: {
        id: { in: input.services.map((s) => s.serviceId) },
        businessId: ctx.businessId,
      },
      select: { id: true, price: true },
    });
    if (serviceData.length !== input.services.length) {
      return fail(404, "One or more services were not found");
    }

    let originalValue = 0;
    for (const s of input.services) {
      const service = serviceData.find((sd) => sd.id === s.serviceId);
      if (service) originalValue += Number(service.price) * (s.quantity || 1);
    }

    const savingsAmount = originalValue - input.price;
    const savingsPercent =
      originalValue > 0 ? (savingsAmount / originalValue) * 100 : 0;

    const pkg = await prisma.package.create({
      data: {
        businessId: ctx.businessId,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        originalValue,
        savingsAmount,
        savingsPercent,
        validityDays: input.validityDays,
        image: input.image ?? null,
        isPopular: input.isPopular,
        services: {
          create: input.services.map((s) => ({
            serviceId: s.serviceId,
            quantity: s.quantity || 1,
          })),
        },
      },
      include: {
        services: true,
      },
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
