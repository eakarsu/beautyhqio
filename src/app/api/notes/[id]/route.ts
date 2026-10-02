import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    const note = await prisma.clientNote.findFirst({
      where: { id, client: { businessId: ctx.businessId } },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!note) fail(404, "Note not found");

    return note;
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
        content: z.string().trim().min(1).max(10000).optional(),
        isPrivate: z.boolean().optional(),
        isPinned: z.boolean().optional(),
      })
      .parse(await request.json());

    const existing = await prisma.clientNote.findFirst({
      where: { id, client: { businessId: ctx.businessId } },
      select: { id: true },
    });
    if (!existing) fail(404, "Note not found");

    return prisma.clientNote.update({
      where: { id },
      data: {
        ...(body.content !== undefined && { content: body.content }),
        ...(body.isPrivate !== undefined && { isPrivate: body.isPrivate }),
        ...(body.isPinned !== undefined && { isPinned: body.isPinned }),
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

    const result = await prisma.clientNote.deleteMany({
      where: { id, client: { businessId: ctx.businessId } },
    });
    if (!result.count) fail(404, "Note not found");

    return { success: true };
  });
}
