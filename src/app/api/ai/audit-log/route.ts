// Wellness AI audit log
// GET: paginated list scoped to current business; supports clientId / feature filters.
// POST: write a row (used by other server-side handlers, but exposed for ad-hoc client logging).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { getPagination, paginatedResponse } from "@/lib/security";

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
    (prisma as any).wellnessAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    (prisma as any).wellnessAuditLog.count({ where }),
  ]);
  return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId) {
    return NextResponse.json({ error: "no business context" }, { status: 400 });
  }

  const { clientId, feature, action, resourceId, metadata } = await req.json();
  if (!feature || !action) {
    return NextResponse.json(
      { error: "feature and action are required" },
      { status: 400 }
    );
  }

  const row = await (prisma as any).wellnessAuditLog.create({
    data: {
      businessId: auth.businessId,
      userId: auth.id,
      clientId: clientId || null,
      feature,
      action,
      resourceId: resourceId || null,
      metadata: metadata || null,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
