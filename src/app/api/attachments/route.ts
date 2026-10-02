import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const fileType = searchParams.get("fileType");

    if (!clientId) fail(400, "clientId is required");

    const attachments = await prisma.attachment.findMany({
      where: {
        clientId,
        client: { businessId: ctx.businessId },
        ...(fileType && { fileType }),
      },
      orderBy: { createdAt: "desc" },
    });

    return attachments;
  });
}

export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const body = z
      .object({
        clientId: idSchema,
        fileName: z.string().trim().min(1).max(300),
        filePath: z.string().trim().min(1).max(2000),
        fileType: z.string().trim().max(200).optional(),
        fileSize: z.coerce.number().int().nonnegative().max(1_000_000_000).optional(),
        description: z.string().max(2000).optional().nullable(),
      })
      .parse(await request.json());

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!client) fail(404, "Client not found");

    const attachment = await prisma.attachment.create({
      data: {
        clientId: body.clientId,
        uploadedById: ctx.user.id,
        fileName: body.fileName,
        fileType: body.fileType || "application/octet-stream",
        fileSize: body.fileSize || 0,
        filePath: body.filePath,
        description: body.description ?? null,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        clientId: body.clientId,
        userId: ctx.user.id,
        type: "NOTE_ADDED",
        title: "File uploaded",
        description: body.fileName,
      },
    });

    return attachment;
  });
}
