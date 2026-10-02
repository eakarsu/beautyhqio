import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const addOnSchema = z.object({
  name: z.string().trim().min(1).max(150),
  price: z.coerce.number().finite().nonnegative().max(1_000_000),
  duration: z.coerce.number().int().min(0).max(1440).default(0),
});

// GET /api/services/[id]/addons - Get all add-ons for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    const service = await prisma.service.findFirst({ where: { id, businessId: ctx.businessId }, select: { id: true } });
    if (!service) return fail(404, "Service not found");

    return prisma.serviceAddOn.findMany({
      where: { serviceId: id },
      orderBy: { name: "asc" },
    });
  });
}

// POST /api/services/[id]/addons - Create a new add-on
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const input = addOnSchema.parse(await request.json());

    const service = await prisma.service.findFirst({ where: { id, businessId: ctx.businessId }, select: { id: true } });
    if (!service) return fail(404, "Service not found");

    return prisma.serviceAddOn.create({
      data: {
        serviceId: id,
        name: input.name,
        price: input.price,
        duration: input.duration,
      },
    });
  });
}
