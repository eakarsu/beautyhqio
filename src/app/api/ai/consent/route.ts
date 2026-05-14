// AIConsent API
// POST: record consent for a wellness AI feature (skin/posture/sleep/mental health/symptom)
// GET:  paginated list of consents (current business)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { getPagination, paginatedResponse } from "@/lib/security";

const VALID_FEATURES = new Set([
  "skin_analyzer",
  "mental_health",
  "symptom_checker",
  "posture",
  "sleep",
]);

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { clientId, feature, granted = true, signature } = body || {};

  if (!feature || !VALID_FEATURES.has(feature)) {
    return NextResponse.json(
      { error: "feature must be one of " + [...VALID_FEATURES].join(",") },
      { status: 400 }
    );
  }

  if (!auth.businessId) {
    return NextResponse.json({ error: "no business context" }, { status: 400 });
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = req.headers.get("user-agent") || null;

  const row = await (prisma as any).aIConsent.create({
    data: {
      businessId: auth.businessId,
      clientId: clientId || null,
      userId: auth.id,
      feature,
      granted,
      signature: signature || null,
      ipAddress,
      userAgent,
    },
  });

  // Mirror to audit log
  try {
    await (prisma as any).wellnessAuditLog.create({
      data: {
        businessId: auth.businessId,
        clientId: clientId || null,
        userId: auth.id,
        feature,
        action: granted ? "consent_granted" : "consent_revoked",
        resourceId: row.id,
      },
    });
  } catch {}

  return NextResponse.json(row, { status: 201 });
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!auth.businessId) {
    return NextResponse.json({ error: "no business context" }, { status: 400 });
  }

  const url = new URL(req.url);
  const { page, pageSize, skip, take } = getPagination(url);
  const feature = url.searchParams.get("feature") || undefined;
  const clientId = url.searchParams.get("clientId") || undefined;

  const where: any = {
    businessId: auth.businessId,
    ...(feature ? { feature } : {}),
    ...(clientId ? { clientId } : {}),
  };

  const [rows, total] = await Promise.all([
    (prisma as any).aIConsent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    (prisma as any).aIConsent.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
}
