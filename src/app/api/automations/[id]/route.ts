import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const automationInput = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().max(2000).nullable(),
    isActive: z.boolean(),
    triggerType: z.string().trim().min(1).max(100),
    triggerConfig: z.unknown().nullable(),
    actions: z.unknown(),
    timesTriggered: z.number().int().nonnegative(),
    lastTriggered: z.coerce.date().nullable(),
  })
  .partial();

// GET /api/automations/[id] - Get automation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;

    const automation = await prisma.automation.findFirst({
      where: { id, businessId: ctx.businessId },
    });

    if (!automation) fail(404, "Automation not found");

    return automation;
  });
}

// PUT /api/automations/[id] - Update automation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;
    const input = automationInput.parse(await request.json());

    const existing = await prisma.automation.findFirst({
      where: { id, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!existing) fail(404, "Automation not found");

    return prisma.automation.update({
      where: { id },
      data: input as Prisma.AutomationUpdateInput,
    });
  });
}

// DELETE /api/automations/[id] - Delete automation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;

    const result = await prisma.automation.deleteMany({
      where: { id, businessId: ctx.businessId },
    });
    if (!result.count) fail(404, "Automation not found");

    return { success: true };
  });
}
