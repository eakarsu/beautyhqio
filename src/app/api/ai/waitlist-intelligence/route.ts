// Custom feature (batch_09): Waitlist intelligence — no-show prediction + alternative offer.
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
    const { appointmentId, waitlistClientIds } = body || {};
    if (!appointmentId) return NextResponse.json({ error: "appointmentId required" }, { status: 400 });

    const apt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        services: { include: { service: true } },
        staff: { select: { id: true, displayName: true } },
      },
    });
    if (!apt) return NextResponse.json({ error: "appointment not found" }, { status: 404 });

    // Hydrate up to 10 candidate waitlist clients (or arbitrary clients with recent activity)
    let candidates: any[] = [];
    if (Array.isArray(waitlistClientIds) && waitlistClientIds.length) {
      candidates = await prisma.client.findMany({ where: { id: { in: waitlistClientIds.slice(0, 10) } } });
    } else {
      candidates = await prisma.client.findMany({
        where: { businessId: user.businessId || undefined },
        orderBy: { updatedAt: "desc" },
        take: 10,
      });
    }

    const sys =
      "You evaluate an upcoming appointment's no-show risk and propose waitlist alternatives ranked by likelihood of accepting. JSON only.";
    const usr = `APPOINTMENT: ${JSON.stringify({
      at: apt.scheduledStart,
      services: apt.services.map((s) => s.service.name),
      staff: apt.staff?.displayName,
      client: apt.client ? { name: `${apt.client.firstName} ${apt.client.lastName}`, id: apt.client.id } : null,
    })}\nCANDIDATES: ${JSON.stringify(candidates.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })))}\nReturn JSON {"no_show_probability":0,"recommended_reminders":[{"channel":"sms|email|push","hours_before":0,"message":""}],"waitlist_offers":[{"client_id":"","fit_score":0,"offer_copy":""}],"top_waitlist_pick":""}`;

    const content = await openRouter.generate({
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      maxTokens: 1500,
      temperature: 0.4,
    });

    const parsed = parseAIJson(content) || { raw: content };

    await persistAIResult({
      feature: "waitlist-intelligence",
      businessId: user.businessId,
      userId: user.id,
      input: { appointmentId, candidates: candidates.length },
      output: parsed,
      model: DEFAULT_AI_MODEL,
      durationMs: Date.now() - started,
    });

    return NextResponse.json({
      type: "waitlist-intelligence",
      candidates_considered: candidates.length,
      result: parsed,
      model: DEFAULT_AI_MODEL,
    });
  } catch (e: any) {
    console.error("waitlist-intelligence error:", e.message);
    return NextResponse.json({ error: e.message || "internal error" }, { status: 500 });
  }
}
