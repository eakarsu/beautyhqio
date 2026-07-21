import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isPlatformAdmin && !["OWNER", "MANAGER"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const where: Record<string, unknown> = {};
  if (!user.isPlatformAdmin) where.businessId = user.businessId;
  for (const key of ["entityType", "entityId", "action"] as const) {
    const value = url.searchParams.get(key);
    if (value) where[key] = value.slice(0, 191);
  }
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
    prisma.auditLog.count({ where }),
  ]);
  return NextResponse.json({ logs, pagination: { total, limit, offset, hasMore: offset + logs.length < total } });
}

export async function POST() {
  return NextResponse.json({ error: "CLIENT_AUDIT_WRITES_DISABLED" }, { status: 405, headers: { Allow: "GET" } });
}
