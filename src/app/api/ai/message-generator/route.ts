import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouter } from "@/lib/openrouter";

// POST /api/ai/message-generator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      clientId,
      clientName,
      businessName = "Beauty & Wellness Salon",
      details,
      tone = "friendly",
      language = "English",
    } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Message type is required" },
        { status: 400 }
      );
    }

    const validTypes = [
      "appointment_reminder",
      "follow_up",
      "promotion",
      "birthday",
      "thank_you",
      "reactivation",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    let resolvedClientName = clientName;

    if (clientId && !clientName) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (client) {
        resolvedClientName = `${client.firstName} ${client.lastName}`;
      }
    }

    if (!resolvedClientName) {
      resolvedClientName = "Valued Customer";
    }

    const message = await openRouter.generateMessage({
      type,
      clientName: resolvedClientName,
      businessName,
      details,
      tone,
      language,
    });

    return NextResponse.json({
      success: true,
      message,
      metadata: {
        type,
        clientName: resolvedClientName,
        tone,
        language,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Message generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}
