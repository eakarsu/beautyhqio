/**
 * Facility maintenance GET / PUT / DELETE (apply pass 7 — backlog #3).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureFacilityMaintenanceTable } from "@/lib/db-pass7";

function parseId(idRaw: string) {
  const id = parseInt(idRaw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureFacilityMaintenanceTable();
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id == null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const r: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM facility_maintenance WHERE id = $1`,
      id
    );
    if (!r.length) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(r[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: "read failed", details: e.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureFacilityMaintenanceTable();
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id == null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const allowed: Record<string, string> = {
    title: "title",
    description: "description",
    category: "category",
    priority: "priority",
    scheduledDate: "scheduled_date",
    completedAt: "completed_at",
    recurrence: "recurrence",
    assignee: "assignee",
    vendor: "vendor",
    estimatedCost: "estimated_cost",
    actualCost: "actual_cost",
    status: "status",
    notes: "notes",
  };
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  for (const [k, col] of Object.entries(allowed)) {
    if (k in body) {
      sets.push(`${col} = $${i++}`);
      const v = body[k];
      if ((k === "scheduledDate" || k === "completedAt") && v) {
        vals.push(new Date(v));
      } else {
        vals.push(v);
      }
    }
  }
  if (!sets.length) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }
  sets.push(`updated_at = NOW()`);
  vals.push(id);
  try {
    const r: any = await prisma.$queryRawUnsafe(
      `UPDATE facility_maintenance SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      ...vals
    );
    if (!r.length) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(r[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: "update failed", details: e.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureFacilityMaintenanceTable();
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id == null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const r: any = await prisma.$queryRawUnsafe(
      `DELETE FROM facility_maintenance WHERE id = $1 RETURNING id`,
      id
    );
    if (!r.length) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    return NextResponse.json(
      { error: "delete failed", details: e.message },
      { status: 500 }
    );
  }
}
