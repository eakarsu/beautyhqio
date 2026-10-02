import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { context, endpoint } from "@/lib/operations/core";

const automationInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  triggerType: z.string().trim().min(1).max(100),
  triggerConfig: z.unknown().optional().nullable(),
  actions: z.unknown(),
  isActive: z.boolean().optional().default(true),
});

// GET /api/automations - List automations for the caller's business
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const triggerType = searchParams.get("triggerType");

    const where: Record<string, unknown> = { businessId: ctx.businessId };
    if (isActive !== null) where.isActive = isActive === "true";
    if (triggerType) where.triggerType = triggerType;

    return prisma.automation.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  });
}

// POST /api/automations - Create automation in the caller's business
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const input = automationInput.parse(await request.json());

    return prisma.automation.create({
      data: {
        ...input,
        businessId: ctx.businessId,
      } as Prisma.AutomationUncheckedCreateInput,
    });
  });
}
