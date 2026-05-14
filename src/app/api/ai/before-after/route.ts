// AI Before/After photo comparison.
// POST: { clientId } -> picks the latest BEFORE / AFTER pair, asks LLM to:
//   - score visible improvement (0-100)
//   - draft a marketing-ready Instagram caption
//   - draft a 1-line client-facing message
// GET ?clientId=...: paginated list of past comparisons (stored in ai_results pool).

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
import { getPagination, paginatedResponse } from "@/lib/security";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId) {
    return NextResponse.json({ error: "no business context" }, { status: 400 });
  }

  const rl = aiRateLimiter(identifyAIRequest(auth, req));
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "AI rate limit exceeded", resetAt: rl.resetAt },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { clientId, beforeId, afterId, serviceName } = body || {};
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  // Resolve photo pair: prefer explicit IDs, fall back to latest of each type.
  let beforePhoto = null as any;
  let afterPhoto = null as any;
  if (beforeId) {
    beforePhoto = await prisma.clientPhoto.findUnique({ where: { id: beforeId } });
  } else {
    beforePhoto = await prisma.clientPhoto.findFirst({
      where: { clientId, type: "BEFORE" },
      orderBy: { takenAt: "desc" },
    });
  }
  if (afterId) {
    afterPhoto = await prisma.clientPhoto.findUnique({ where: { id: afterId } });
  } else {
    afterPhoto = await prisma.clientPhoto.findFirst({
      where: { clientId, type: "AFTER" },
      orderBy: { takenAt: "desc" },
    });
  }

  if (!beforePhoto || !afterPhoto) {
    return NextResponse.json(
      { error: "Both BEFORE and AFTER photos are required" },
      { status: 404 }
    );
  }

  const prompt = `Two photos for the same client. BEFORE: ${beforePhoto.filePath}; AFTER: ${afterPhoto.filePath}. Service: ${serviceName || "unknown"}. ${beforePhoto.caption ? `Before caption: ${beforePhoto.caption}` : ""} ${afterPhoto.caption ? `After caption: ${afterPhoto.caption}` : ""}.

Without seeing the images directly, infer based on captions+service. Return JSON:
{
  "improvementScore": 0-100,
  "highlights": ["short bullet", "short bullet"],
  "instagramCaption": "<= 220 chars including hashtags",
  "clientMessage": "1 sentence to send to client",
  "marketingTags": ["#tag1", "#tag2"]
}`;

  const text = await openRouterChat(
    [
      {
        role: "system",
        content:
          "You are a beauty marketing copywriter. Be concise, on-brand, never make medical claims.",
      },
      { role: "user", content: prompt },
    ],
    { temperature: 0.7, maxTokens: 600 }
  );

  const parsed = parseAIJson<any>(text) || {
    improvementScore: 50,
    highlights: [],
    instagramCaption: "Fresh new look! ✨",
    clientMessage: "Loved working with you today!",
    marketingTags: [],
  };

  persistAIResult({
    businessId: auth.businessId,
    userId: auth.id,
    feature: "before_after",
    input: {
      clientId,
      beforeId: beforePhoto.id,
      afterId: afterPhoto.id,
      serviceName,
    },
    output: parsed,
    model: DEFAULT_AI_MODEL,
  });

  return NextResponse.json({
    success: true,
    before: { id: beforePhoto.id, filePath: beforePhoto.filePath },
    after: { id: afterPhoto.id, filePath: afterPhoto.filePath },
    ...parsed,
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId) {
    return NextResponse.json({ error: "no business context" }, { status: 400 });
  }
  const url = new URL(req.url);
  const { page, pageSize, skip, take } = getPagination(url);
  const clientId = url.searchParams.get("clientId");

  const where: any = {
    feature: "before_after",
    businessId: auth.businessId,
    ...(clientId ? { input: { path: ["clientId"], equals: clientId } } : {}),
  };

  let rows: any[] = [];
  let total = 0;
  try {
    [rows, total] = await Promise.all([
      (prisma as any).aiResult.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      (prisma as any).aiResult.count({ where }),
    ]);
  } catch {}

  return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
}
