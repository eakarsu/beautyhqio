import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

// GET messages for a client
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) fail(400, "Client ID is required");

    const messages = await prisma.communication.findMany({
      where: {
        clientId,
        type: "sms", // Filter for SMS/chat messages only
        client: { businessId: ctx.businessId },
      },
      orderBy: {
        sentAt: "asc",
      },
    });

    // Transform to match the frontend interface
    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content || "",
      direction: msg.direction as "inbound" | "outbound",
      createdAt: msg.sentAt.toISOString(),
    }));
  });
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const body = z
      .object({
        clientId: idSchema,
        content: z.string().trim().min(1).max(5000),
        direction: z.enum(["inbound", "outbound"]).default("outbound"),
      })
      .parse(await request.json());

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!client) fail(404, "Client not found");

    const message = await prisma.communication.create({
      data: {
        clientId: body.clientId,
        type: "sms",
        direction: body.direction,
        content: body.content,
        status: "sent",
        sentAt: new Date(),
      },
    });

    return {
      id: message.id,
      content: message.content || "",
      direction: message.direction as "inbound" | "outbound",
      createdAt: message.sentAt.toISOString(),
    };
  });
}
