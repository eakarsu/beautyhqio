import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewText, source } = body as {
      reviewText: string;
      source?: string;
    };

    if (!reviewText || typeof reviewText !== "string") {
      return NextResponse.json(
        { error: "reviewText is required" },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser();
    const business = user?.businessId
      ? await prisma.business.findUnique({ where: { id: user.businessId } })
      : await prisma.business.findFirst();

    const businessName = business?.name || "the salon";

    const prompt = `Analyze this customer review for ${businessName} (source: ${source || "unspecified"}):

REVIEW:
"${reviewText}"

Return a JSON object with this exact shape — no markdown, no commentary:
{
  "sentiment": { "type": "positive" | "negative" | "neutral", "score": <0-100 confidence> },
  "keyThemes": ["<theme1>", "<theme2>"],
  "suggestedResponse": "<a polite, on-brand response the salon could publicly post — 2-4 sentences>",
  "actionItems": ["<concrete internal action>", ...],
  "priority": "high" | "medium" | "low",
  "summary": "<one-sentence summary of the reviewer's experience>"
}

Rules:
- "score" is your confidence in the sentiment classification (0-100)
- "keyThemes" should be 2-5 short phrases like "Wait Time", "Stylist Quality", "Pricing"
- "priority" = high if the review is negative or contains complaints needing immediate response; medium for mixed; low for clearly positive
- "actionItems" must be specific (e.g., "Personally call client to apologize and offer redo") not generic`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content:
            "You are an expert salon reputation manager. Always respond with valid JSON only — no prose around it.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 1500, temperature: 0.3 }
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze sentiment",
      },
      { status: 500 }
    );
  }
}
