import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";

const ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;

// PATCH /api/tasks/[id] - complete, reopen, cancel, or reassign within tenant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles([...ROLES]);
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId) {
    return NextResponse.json({ error: "No business context" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await prisma.staffTask.findFirst({
    where: { id, businessId: auth.businessId },
  });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (body.status === "DONE") {
    data.status = "DONE";
    data.completedAt = new Date();
  } else if (body.status === "OPEN") {
    data.status = "OPEN";
    data.completedAt = null;
  } else if (body.status === "CANCELLED") {
    data.status = "CANCELLED";
    data.completedAt = null;
  } else if (body.status !== undefined) {
    return NextResponse.json({ error: "status must be OPEN, DONE, or CANCELLED" }, { status: 422 });
  }
  if (typeof body.assigneeId === "string" || body.assigneeId === null) {
    if (body.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: body.assigneeId as string, businessId: auth.businessId, isActive: true },
        select: { id: true },
      });
      if (!assignee) return NextResponse.json({ error: "Assignee not found in this business" }, { status: 404 });
    }
    data.assigneeId = body.assigneeId;
  }
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 200);
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
  }
  const task = await prisma.staffTask.update({ where: { id: existing.id }, data });
  await prisma.auditLog.create({
    data: {
      userId: auth.id,
      businessId: auth.businessId,
      action: "TASK_UPDATED",
      entityType: "StaffTask",
      entityId: task.id,
      changes: data as never,
    },
  });
  return NextResponse.json({ task });
}
