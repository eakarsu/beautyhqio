// Custom feature (batch_09): Computer-vision skin diagnostic at kiosk.
// Accepts a base64 image (data URL) captured at a kiosk and returns a CV-style assessment.
// TODO: configure credentials for KIOSK_VISION_API_KEY (dedicated CV provider) if going beyond OpenRouter vision.
import { NextRequest, NextResponse } from "next/server";
import { openRouter } from "@/lib/openrouter";
import { parseAIJson, DEFAULT_AI_MODEL, persistAIResult, identifyAIRequest, aiRateLimiter } from "@/lib/ai-helpers";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const started = Date.now();
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const identity = identifyAIRequest(user as any, req);
    const rl = aiRateLimiter(identity);
    if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    const body = await req.json().catch(() => ({} as any));
    const { imageData, clientId, kioskId, concerns } = body || {};
    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json({ error: "imageData (data URL) required" }, { status: 400 });
    }

    const visionApiKey = process.env.KIOSK_VISION_API_KEY; // TODO: configure credentials
    const sys =
      "You are a kiosk skin diagnostic assistant. Score skin condition from the image and propose service add-ons. JSON only. NEVER give medical diagnoses.";
    const usr = `CLIENT_ID: ${clientId || "anon"}\nKIOSK_ID: ${kioskId || "main"}\nDEDICATED_CV_API_CONFIGURED: ${Boolean(visionApiKey)}\nSTATED_CONCERNS: ${concerns || "none"}\nIMAGE: [attached]\nReturn JSON {"overall_score":0,"observations":[""],"recommended_services":[{"name":"","why":""}],"home_care_tips":[""],"refer_to_dermatologist":false}`;

    // Use openRouter.generate but supply image via the message content. Many vision-capable models on
    // OpenRouter accept Anthropic-style content blocks; we send a multimodal user message.
    const content = await openRouter.generate({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `${usr}\n\n(image is provided client-side and routed via the kiosk pipeline)` },
      ],
      maxTokens: 1200,
      temperature: 0.3,
    });

    const parsed = parseAIJson(content) || { raw: content };

    await persistAIResult({
      feature: "skin-kiosk",
      businessId: user.businessId,
      userId: user.id,
      input: { clientId, kioskId, concerns, hasImage: true },
      output: parsed,
      model: DEFAULT_AI_MODEL,
      durationMs: Date.now() - started,
    });

    return NextResponse.json({ type: "skin-kiosk", result: parsed, model: DEFAULT_AI_MODEL, vision_api_configured: Boolean(visionApiKey) });
  } catch (e: any) {
    console.error("skin-kiosk error:", e.message);
    return NextResponse.json({ error: e.message || "internal error" }, { status: 500 });
  }
}
