import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { createTaskSchema } from "@/lib/tasks";

const ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;

// GET /api/tasks?status=OPEN|DONE|CANCELLED - this business's staff tasks
export async function GET(request: NextRequest) {
  const auth = await requireRoles([...ROLES]);
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No business context" }, { status: 403 });
  }
  const businessId =
    auth.isPlatformAdmin && request.nextUrl.searchParams.get("businessId")
      ? (request.nextUrl.searchParams.get("businessId") as string)
      : auth.businessId;
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  const status = request.nextUrl.searchParams.get("status");
  const tasks = await prisma.staffTask.findMany({
    where: {
      businessId,
      ...(status === "OPEN" || status === "DONE" || status === "CANCELLED"
        ? { status }
        : {}),
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json({ tasks });
}

// POST /api/tasks - create a durable follow-up task in the caller's business
export async function POST(request: NextRequest) {
  const auth = await requireRoles([...ROLES]);
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId) {
    return NextResponse.json({ error: "No business context" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task" },
      { status: 422 },
    );
  }
  const input = parsed.data;
  if (input.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, businessId: auth.businessId },
      select: { id: true },
    });
    if (!client) return NextResponse.json({ error: "Client not found in this business" }, { status: 404 });
  }
  if (input.assigneeId) {
    const assignee = await prisma.user.findFirst({
      where: { id: input.assigneeId, businessId: auth.businessId, isActive: true },
      select: { id: true },
    });
    if (!assignee) return NextResponse.json({ error: "Assignee not found in this business" }, { status: 404 });
  }
  const task = await prisma.staffTask.create({
    data: {
      businessId: auth.businessId,
      createdById: auth.id,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      assigneeId: input.assigneeId ?? null,
      clientId: input.clientId ?? null,
      appointmentId: input.appointmentId ?? null,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: auth.id,
      businessId: auth.businessId,
      action: "TASK_CREATED",
      entityType: "StaffTask",
      entityId: task.id,
      changes: { title: task.title, priority: task.priority },
    },
  });
  return NextResponse.json({ task }, { status: 201 });
}
