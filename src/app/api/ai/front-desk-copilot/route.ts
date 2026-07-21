// AI Front-Desk Copilot
// Watches the live appointment stream and emits proactive suggestions:
//   - upsells   (next-appointment service add-ons)
//   - rebooks   (gaps in stylist schedule)
//   - waitlist  (slots that just opened up)
// Returns a structured JSON list. Designed for poll-based UI (5-15s).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouterChat } from "@/lib/openrouter";
import { requireAuth } from "@/lib/api-auth";
import {
  aiRateLimiter,
  parseAIJson,
  persistAIResult,
  identifyAIRequest,
  DEFAULT_AI_MODEL,
} from "@/lib/ai-helpers";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!auth.businessId) {
    return NextResponse.json({ error: "no business context" }, { status: 400 });
  }

  // Rate-limit per user (prevents runaway polling).
  const rl = aiRateLimiter(identifyAIRequest(auth, req));
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "AI rate limit exceeded", resetAt: rl.resetAt },
      { status: 429 }
    );
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 6 * 60 * 60 * 1000); // next 6 hours

  // Pull real signals from the DB so the LLM is GROUNDED, not hallucinating.
  const [upcoming, waitlist, openSlotsByStaff] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        businessId: auth.businessId,
        scheduledStart: { gte: now, lte: horizon },
        status: { in: ["BOOKED", "CONFIRMED"] },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        staff: { select: { id: true, displayName: true } },
        services: { include: { service: true } },
      },
      orderBy: { scheduledStart: "asc" },
      take: 30,
    }),
    prisma.waitlistEntry.findMany({
      where: { location: { businessId: auth.businessId }, status: "WAITING" },
      take: 20,
    }).catch(() => [] as any[]),
    prisma.staff.findMany({
      where: { location: { businessId: auth.businessId }, isActive: true },
      select: { id: true, displayName: true },
      take: 20,
    }),
  ]);

  const summary = {
    appointments: upcoming.map((a) => ({
      id: a.id,
      clientName: a.client
        ? `${a.client.firstName} ${a.client.lastName}`
        : "—",
      staff: a.staff?.displayName,
      start: a.scheduledStart,
      services: a.services.map((s) => s.service?.name).filter(Boolean),
    })),
    waitlistCount: waitlist.length,
    activeStaff: openSlotsByStaff.map((s) => s.displayName),
  };

  const prompt = `Live front-desk feed (next 6 hours) for a salon. Suggest up to 6 actionable items.

DATA:
${JSON.stringify(summary, null, 2)}

Return JSON exactly:
{
  "suggestions": [
    {
      "type": "upsell" | "rebook" | "waitlist" | "reminder",
      "appointmentId": "string|null",
      "title": "short, actionable",
      "rationale": "1 sentence",
      "action": "what front desk should do (one click step)"
    }
  ]
}`;

  let response = "";
  try {
    response = await openRouterChat(
      [
        {
          role: "system",
          content:
            "You are a front-desk copilot for a beauty salon. Be concise, only suggest items justified by the data, prefer high-impact actions.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.3, maxTokens: 1500 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "AI provider unavailable", detail: String(err) },
      { status: 502 }
    );
  }

  const parsed = parseAIJson<any>(response) || { suggestions: [] };

  persistAIResult({
    businessId: auth.businessId,
    userId: auth.id,
    feature: "front_desk_copilot",
    input: summary,
    output: parsed,
    model: DEFAULT_AI_MODEL,
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    counts: {
      appointments: summary.appointments.length,
      waitlist: summary.waitlistCount,
    },
  });
}
