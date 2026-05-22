/**
 * Recovery coach (apply pass 7 — backlog #6).
 *
 * PRODUCT-DECISION: wraps the same OpenRouter chat pattern used by
 * `/api/ai/sleep-coach` but specializes the system prompt for post-service
 * recovery follow-up. Caller supplies `post_service_context` (free-form notes
 * about the just-completed service) plus optional client metadata.
 *
 * Every response carries `disclaimer` + `requires_human_review: true` per the
 * project's safety policy. Sessions are persisted to `recovery_coach_sessions`.
 *
 * If OPENROUTER_API_KEY is not configured, the route returns a non-AI fallback
 * envelope (still with disclaimer + requires_human_review) so the UI flow
 * keeps working in dev without credentials.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouterChat } from "@/lib/openrouter";
import {
  ensureRecoveryCoachSessionsTable,
  PASS7_DISCLAIMER,
} from "@/lib/db-pass7";

export async function POST(req: NextRequest) {
  await ensureRecoveryCoachSessionsTable();
  const body = await req.json().catch(() => ({}));
  const {
    clientId,
    appointmentId,
    serviceName,
    post_service_context,
    postServiceContext,
    sensitivities,
    skinType,
  } = body || {};

  const ctx: string | undefined = post_service_context ?? postServiceContext;
  if (!ctx || typeof ctx !== "string" || !ctx.trim()) {
    return NextResponse.json(
      { error: "post_service_context required" },
      { status: 400 }
    );
  }

  const prompt = `You are a recovery / aftercare specialist for a beauty + wellness clinic. The client just completed a service. Produce safe post-service guidance.

Service: ${serviceName || "unspecified"}
Skin type: ${skinType || "unspecified"}
Known sensitivities: ${sensitivities || "none reported"}
Post-service context (provider notes): ${ctx}

Respond with JSON ONLY in this shape:
{
  "summary": "1-2 sentence overview of what the client should focus on",
  "do_today": ["list of immediate self-care actions for the next 24h"],
  "avoid_24h": ["list of things to avoid in the next 24h"],
  "warning_signs": ["symptoms that should trigger a call back to the clinic"],
  "followup_in_days": 3,
  "products_to_consider": ["optional product or service suggestions"]
}

Stay general; do not prescribe medication or diagnose conditions.`;

  let guidance: any;
  let aiUsed = false;
  try {
    if (process.env.OPENROUTER_API_KEY) {
      const response = await openRouterChat(
        [
          {
            role: "system",
            content:
              "You are a licensed esthetician + recovery coach. Give safe, conservative post-service aftercare guidance. Output valid JSON only. Never diagnose. Always include warning signs that warrant escalation to a human practitioner.",
          },
          { role: "user", content: prompt },
        ],
        { temperature: 0.4, maxTokens: 1200 }
      );
      const m = response.match(/\{[\s\S]*\}/);
      if (m) {
        guidance = JSON.parse(m[0]);
        aiUsed = true;
      }
    }
  } catch (e) {
    // fall through to safe fallback
  }

  if (!guidance) {
    guidance = {
      summary:
        "Keep the treated area clean, avoid irritation, and monitor for unexpected symptoms.",
      do_today: [
        "Stay hydrated",
        "Gentle skincare only (no actives)",
        "Apply SPF if treated area is sun-exposed",
      ],
      avoid_24h: [
        "Direct sun exposure",
        "Hot showers / saunas",
        "Heavy exercise",
        "Exfoliants and retinoids",
      ],
      warning_signs: [
        "Persistent redness >48h",
        "Blistering",
        "Severe pain",
        "Signs of infection (warmth, pus, fever)",
      ],
      followup_in_days: 3,
      products_to_consider: [],
    };
  }

  const envelope = {
    success: true,
    ai_used: aiUsed,
    guidance,
    disclaimer: PASS7_DISCLAIMER,
    requires_human_review: true,
  };

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO recovery_coach_sessions
       (client_id, appointment_id, service_name, post_service_context, guidance, disclaimer, requires_human_review)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)`,
      clientId || null,
      appointmentId || null,
      serviceName || null,
      ctx,
      JSON.stringify(guidance),
      PASS7_DISCLAIMER,
      true
    );
  } catch (_e) {
    // persistence is best-effort; the envelope is still returned
  }

  return NextResponse.json(envelope);
}

export async function GET(req: NextRequest) {
  await ensureRecoveryCoachSessionsTable();
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const appointmentId = searchParams.get("appointmentId");
  try {
    const clauses: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (clientId) {
      clauses.push(`client_id = $${i++}`);
      vals.push(clientId);
    }
    if (appointmentId) {
      clauses.push(`appointment_id = $${i++}`);
      vals.push(appointmentId);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM recovery_coach_sessions ${where} ORDER BY created_at DESC LIMIT 100`,
      ...vals
    );
    return NextResponse.json({ count: rows.length, items: rows });
  } catch (e: any) {
    return NextResponse.json(
      { error: "read failed", details: e.message },
      { status: 500 }
    );
  }
}
