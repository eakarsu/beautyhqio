import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const pinnedOnly = searchParams.get("pinned") === "true";

    if (!clientId) fail(400, "clientId is required");

    const notes = await prisma.clientNote.findMany({
      where: {
        clientId,
        client: { businessId: ctx.businessId },
        ...(pinnedOnly && { isPinned: true }),
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    return notes;
  });
}

export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const body = z
      .object({
        clientId: idSchema,
        content: z.string().trim().min(1).max(10000),
        isPrivate: z.boolean().optional(),
        isPinned: z.boolean().optional(),
      })
      .parse(await request.json());

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!client) fail(404, "Client not found");

    const note = await prisma.clientNote.create({
      data: {
        clientId: body.clientId,
        createdById: ctx.user.id,
        content: body.content,
        isPrivate: body.isPrivate || false,
        isPinned: body.isPinned || false,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        clientId: body.clientId,
        userId: ctx.user.id,
        type: "NOTE_ADDED",
        title: "Note added",
        description: body.content.substring(0, 100),
      },
    });

    return note;
  });
}
