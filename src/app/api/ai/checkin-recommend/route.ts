// Custom feature (batch_09): Micro-prediction service recommendation at check-in.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const { clientId, appointmentId } = body || {};
    if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        appointments: {
          orderBy: { scheduledStart: "desc" },
          take: 10,
          include: { services: { include: { service: true } } },
        },
      },
    });
    if (!client) return NextResponse.json({ error: "client not found" }, { status: 404 });

    const services = await prisma.service.findMany({
      where: { businessId: user.businessId || undefined, isActive: true },
      take: 30,
      select: { id: true, name: true, category: true, duration: true, price: true },
    });

    const history = client.appointments.map((a: any) => ({
      at: a.scheduledStart,
      services: a.services.map((s: any) => s.service.name),
    }));

    const sys =
      "You are a check-in concierge. Suggest up to 3 add-on or core services to recommend at check-in for this client. JSON only.";
    const usr = `CLIENT: ${client.firstName} ${client.lastName}\nHISTORY: ${JSON.stringify(history)}\nAVAILABLE_SERVICES: ${JSON.stringify(services)}\nReturn JSON {"recommendations":[{"service_id":"","name":"","why":"","upsell_value_usd":0,"confidence":0}],"primary_pitch":""}`;

    const content = await openRouter.generate({
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      maxTokens: 1200,
      temperature: 0.4,
    });

    const parsed = parseAIJson(content) || { raw: content };

    await persistAIResult({
      feature: "checkin-recommend",
      businessId: user.businessId,
      userId: user.id,
      input: { clientId, appointmentId },
      output: parsed,
      model: DEFAULT_AI_MODEL,
      durationMs: Date.now() - started,
    });

    return NextResponse.json({ type: "checkin-recommend", result: parsed, model: DEFAULT_AI_MODEL });
  } catch (e: any) {
    console.error("checkin-recommend error:", e.message);
    return NextResponse.json({ error: e.message || "internal error" }, { status: 500 });
  }
}
