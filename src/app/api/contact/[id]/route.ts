import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { endpoint, fail, platformContext } from "@/lib/operations/core";

// Mark message as read/unread
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    await platformContext();
    const { id } = await params;
    const { isRead } = z.object({ isRead: z.boolean() }).parse(await request.json());

    const existing = await prisma.contactMessage.findFirst({ where: { id }, select: { id: true } });
    if (!existing) fail(404, "Message not found");

    return prisma.contactMessage.update({
      where: { id },
      data: { isRead },
    });
  });
}

// Delete message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    await platformContext();
    const { id } = await params;

    const result = await prisma.contactMessage.deleteMany({ where: { id } });
    if (!result.count) fail(404, "Message not found");

    return { success: true };
  });
}
