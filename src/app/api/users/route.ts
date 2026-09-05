import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { createUserSchema, userSelect, userScope, userError } from "@/lib/user-management";

export async function GET(request: NextRequest) {
  const actor = await requireRoles(["OWNER"]);
  if (actor instanceof NextResponse) return actor;
  const businessId = request.nextUrl.searchParams.get("businessId");
  if (businessId && !actor.isPlatformAdmin && businessId !== actor.businessId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(await prisma.user.findMany({ where: { ...userScope(actor), ...(businessId ? { businessId } : {}) }, select: userSelect, orderBy: [{ role: "asc" }, { firstName: "asc" }] }));
  } catch (error) { return userError(error); }
}

export async function POST(request: NextRequest) {
  const actor = await requireRoles(["OWNER"]);
  if (actor instanceof NextResponse) return actor;
  try {
    const { password, businessId: requestedBusiness, ...input } = createUserSchema.parse(await request.json().catch(() => null));
    if (!actor.isPlatformAdmin && (input.role === "PLATFORM_ADMIN" || (requestedBusiness && requestedBusiness !== actor.businessId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const businessId = actor.isPlatformAdmin ? requestedBusiness || actor.businessId : actor.businessId;
    if (!businessId) return NextResponse.json({ error: "Business ID is required" }, { status: 422 });
    // Accounts created without a password use the existing password-reset flow.
    const hash = await bcrypt.hash(password || randomBytes(32).toString("base64url"), 12);
    const user = await prisma.user.create({ data: { ...input, password: hash, businessId }, select: userSelect });
    return NextResponse.json(user, { status: 201 });
  } catch (error) { return userError(error); }
}
