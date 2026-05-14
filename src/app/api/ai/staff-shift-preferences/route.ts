// Custom feature (batch_09): Staff shift-preference learning with fairness optimization.
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
    const { staffId, lookbackDays = 60 } = body || {};
    if (!staffId) return NextResponse.json({ error: "staffId required" }, { status: 400 });

    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    const appointments = await prisma.appointment.findMany({
      where: { staffId, scheduledStart: { gte: since } },
      orderBy: { scheduledStart: "asc" },
      take: 200,
      select: { scheduledStart: true, scheduledEnd: true, status: true },
    });

    // Build a histogram by day-of-week and hour
    const hist: Record<string, number> = {};
    for (const a of appointments) {
      const d = new Date(a.scheduledStart);
      const key = `${d.getDay()}-${d.getHours()}`;
      hist[key] = (hist[key] || 0) + 1;
    }

    const sys =
      "You learn shift preferences for a staff member and propose a fair schedule. JSON only.";
    const usr = `STAFF_ID: ${staffId}\nLOOKBACK_DAYS: ${lookbackDays}\nSHIFT_HISTOGRAM: ${JSON.stringify(hist)}\nReturn JSON {"preferred_days":[""],"preferred_hours":[""],"avoid_blocks":[""],"fairness_recommendations":[""],"confidence":0}`;

    const content = await openRouter.generate({
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      maxTokens: 1000,
      temperature: 0.3,
    });

    const parsed = parseAIJson(content) || { raw: content };

    await persistAIResult({
      feature: "staff-shift-preferences",
      businessId: user.businessId,
      userId: user.id,
      input: { staffId, lookbackDays, sampleSize: appointments.length },
      output: parsed,
      model: DEFAULT_AI_MODEL,
      durationMs: Date.now() - started,
    });

    return NextResponse.json({
      type: "staff-shift-preferences",
      sampleSize: appointments.length,
      result: parsed,
      model: DEFAULT_AI_MODEL,
    });
  } catch (e: any) {
    console.error("staff-shift-preferences error:", e.message);
    return NextResponse.json({ error: e.message || "internal error" }, { status: 500 });
  }
}
