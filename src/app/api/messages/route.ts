import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET messages for a client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const messages = await prisma.communication.findMany({
      where: {
        clientId,
        type: "sms", // Filter for SMS/chat messages only
      },
      orderBy: {
        sentAt: "asc",
      },
    });

    // Transform to match the frontend interface
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content || "",
      direction: msg.direction as "inbound" | "outbound",
      createdAt: msg.sentAt.toISOString(),
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, content, direction = "outbound" } = body;

    if (!clientId || !content) {
      return NextResponse.json(
        { error: "Client ID and content are required" },
        { status: 400 }
      );
    }

    const message = await prisma.communication.create({
      data: {
        clientId,
        type: "sms",
        direction,
        content,
        status: "sent",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      id: message.id,
      content: message.content || "",
      direction: message.direction as "inbound" | "outbound",
      createdAt: message.sentAt.toISOString(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
