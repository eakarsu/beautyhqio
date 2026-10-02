import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const attachmentInclude = {
  client: {
    select: { firstName: true, lastName: true },
  },
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    const attachment = await prisma.attachment.findFirst({
      where: { id, client: { businessId: ctx.businessId } },
      include: attachmentInclude,
    });

    if (!attachment) fail(404, "Attachment not found");

    return attachment;
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;
    const body = z
      .object({
        fileName: z.string().trim().min(1).max(300).optional(),
        description: z.string().max(2000).optional().nullable(),
      })
      .parse(await request.json());

    const existing = await prisma.attachment.findFirst({
      where: { id, client: { businessId: ctx.businessId } },
      select: { id: true },
    });
    if (!existing) fail(404, "Attachment not found");

    return prisma.attachment.update({
      where: { id },
      data: {
        ...(body.fileName !== undefined && { fileName: body.fileName }),
        ...(body.description !== undefined && { description: body.description }),
      },
    });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    // Get attachment first for activity logging
    const attachment = await prisma.attachment.findFirst({
      where: { id, client: { businessId: ctx.businessId } },
    });
    if (!attachment) fail(404, "Attachment not found");

    await prisma.attachment.delete({ where: { id } });

    // Log activity
    await prisma.activity.create({
      data: {
        clientId: attachment.clientId,
        userId: ctx.user.id,
        type: "NOTE_ADDED",
        title: "File deleted",
        description: attachment.fileName,
      },
    });

    return { success: true };
  });
}
