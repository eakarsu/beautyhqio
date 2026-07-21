import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceLoginRateLimit, issueMobileSession } from "@/lib/mobile-session";

const requestSchema = z.object({ email: z.string().email().transform((v) => v.toLowerCase().trim()), password: z.string().min(1).max(256) });

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 422 });
  const identityHash = await enforceLoginRateLimit(prisma, `${request.headers.get("x-forwarded-for") || "unknown"}:${parsed.data.email}`).catch(() => null);
  if (!identityHash) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429, headers: { "Retry-After": "900" } });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { business: true, staff: true } });
  const valid = Boolean(user?.isActive && user.password && await bcrypt.compare(parsed.data.password, user.password));
  await prisma.loginAttempt.create({ data: { identityHash, succeeded: valid } });
  if (!valid || !user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const credentials = await issueMobileSession(prisma, user);
  await prisma.auditLog.create({ data: { userId: user.id, businessId: user.businessId, action: "MOBILE_LOGIN", entityType: "User", entityId: user.id } });
  return NextResponse.json({
    ...credentials,
    user: {
      id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`.trim(), phone: user.phone,
      image: user.avatar, role: user.role, businessId: user.businessId, staffId: user.staff?.id || null,
      isClient: user.role === "CLIENT", createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString(),
    },
  });
}
