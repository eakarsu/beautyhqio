import { NextRequest, NextResponse } from "next/server";
import { openRouter } from "@/lib/openrouter";

// POST /api/ai/translate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage, context } = body;

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    if (!targetLanguage) {
      return NextResponse.json(
        { error: "targetLanguage is required" },
        { status: 400 }
      );
    }

    const result = await openRouter.translate(text, targetLanguage, context);

    return NextResponse.json({
      success: true,
      original: text,
      translation: result.translation,
      targetLanguage,
      detectedSourceLanguage: result.detectedSourceLanguage,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}
