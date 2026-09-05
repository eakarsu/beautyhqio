import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { updateUserSchema, userSelect, userScope, userError } from "@/lib/user-management";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  const actor = await requireRoles(["OWNER"]);
  if (actor instanceof NextResponse) return actor;
  try {
    const { id } = await params;
    const user = await prisma.user.findFirst({ where: { ...userScope(actor), id }, select: userSelect });
    return user ? NextResponse.json(user) : NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) { return userError(error); }
}
export async function PUT(request: NextRequest, { params }: Context) {
  const actor = await requireRoles(["OWNER"]);
  if (actor instanceof NextResponse) return actor;
  try {
    const { id } = await params;
    const data = updateUserSchema.parse(await request.json().catch(() => null));
    if (!actor.isPlatformAdmin && data.role === "PLATFORM_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await prisma.user.update({ where: { ...userScope(actor), id }, data, select: userSelect });
    return NextResponse.json(user);
  } catch (error) { return userError(error); }
}
export async function DELETE(_request: NextRequest, { params }: Context) {
  const actor = await requireRoles(["OWNER"]);
  if (actor instanceof NextResponse) return actor;
  try {
    const { id } = await params;
    await prisma.user.update({ where: { ...userScope(actor), id }, data: { isActive: false }, select: { id: true } });
    return NextResponse.json({ success: true });
  } catch (error) { return userError(error); }
}
