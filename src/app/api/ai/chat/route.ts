import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // System message for salon assistant context
    const systemMessage = {
      role: "system" as const,
      content: `You are an AI assistant for a beauty and wellness salon management system. You help salon owners and staff with:
- Scheduling and appointment management
- Client recommendations and insights
- Business analytics and reporting
- Marketing campaigns and promotions
- Inventory management
- Staff scheduling and performance
- Review management

${context ? `Current Context: ${JSON.stringify(context)}` : ""}

Be helpful, professional, and provide actionable advice. When discussing numbers, be specific. When making recommendations, explain your reasoning. If you don't have enough information, ask clarifying questions.`,
    };

    // Format messages for OpenRouter
    const formattedMessages = [
      systemMessage,
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const response = await openRouterChat(formattedMessages, {
      maxTokens: 2048,
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      message: response,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get AI response",
      },
      { status: 500 }
    );
  }
}
