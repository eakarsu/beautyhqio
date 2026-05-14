// Custom feature (batch_09): Therapist-client matching optimization.
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
    const { clientId, serviceId, preferredAt } = body || {};
    if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: "client not found" }, { status: 404 });

    const staff = await prisma.staff.findMany({
      where: { businessId: user.businessId || undefined, isActive: true },
      take: 30,
      select: { id: true, displayName: true, specialties: true, rating: true },
    });

    const pastAppointments = await prisma.appointment.findMany({
      where: { clientId },
      orderBy: { scheduledStart: "desc" },
      take: 12,
      select: { staffId: true, status: true, scheduledStart: true },
    });

    const sys =
      "You match a beauty/wellness client to the best available therapist by rapport, specialty fit, and historical satisfaction. JSON only.";
    const usr = `CLIENT_ID: ${clientId}\nSERVICE_ID: ${serviceId || "any"}\nWHEN: ${preferredAt || "next available"}\nSTAFF_POOL: ${JSON.stringify(staff)}\nPRIOR_VISITS: ${JSON.stringify(pastAppointments)}\nReturn JSON {"ranked":[{"staff_id":"","name":"","fit_score":0,"why":""}],"top_pick_id":"","fallback_strategy":""}`;

    const content = await openRouter.generate({
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      maxTokens: 1200,
      temperature: 0.3,
    });

    const parsed = parseAIJson(content) || { raw: content };

    await persistAIResult({
      feature: "therapist-match",
      businessId: user.businessId,
      userId: user.id,
      input: { clientId, serviceId, preferredAt },
      output: parsed,
      model: DEFAULT_AI_MODEL,
      durationMs: Date.now() - started,
    });

    return NextResponse.json({ type: "therapist-match", result: parsed, model: DEFAULT_AI_MODEL });
  } catch (e: any) {
    console.error("therapist-match error:", e.message);
    return NextResponse.json({ error: e.message || "internal error" }, { status: 500 });
  }
}
