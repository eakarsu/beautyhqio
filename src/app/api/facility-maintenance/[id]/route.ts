/**
 * Facility maintenance GET / PUT / DELETE (apply pass 7 — backlog #3).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureFacilityMaintenanceTable } from "@/lib/db-pass7";
import { context, endpoint, fail } from "@/lib/operations/core";

function parseId(idRaw: string) {
  const id = parseInt(idRaw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    await ensureFacilityMaintenanceTable();
    const { id: idRaw } = await params;
    const id = parseId(idRaw);
    if (id == null) fail(400, "invalid id");

    const r: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM facility_maintenance WHERE id = $1 AND business_id = $2`,
      id,
      ctx.businessId
    );
    if (!r.length) fail(404, "not found");
    return r[0];
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    await ensureFacilityMaintenanceTable();
    const { id: idRaw } = await params;
    const id = parseId(idRaw);
    if (id == null) fail(400, "invalid id");

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
    if (!sets.length) fail(400, "no fields to update");
    sets.push(`updated_at = NOW()`);
    const idPlaceholder = i++;
    const bizPlaceholder = i++;
    vals.push(id, ctx.businessId);

    const r: any[] = await prisma.$queryRawUnsafe(
      `UPDATE facility_maintenance SET ${sets.join(", ")} WHERE id = $${idPlaceholder} AND business_id = $${bizPlaceholder} RETURNING *`,
      ...vals
    );
    if (!r.length) fail(404, "not found");
    return r[0];
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    await ensureFacilityMaintenanceTable();
    const { id: idRaw } = await params;
    const id = parseId(idRaw);
    if (id == null) fail(400, "invalid id");

    const r: any[] = await prisma.$queryRawUnsafe(
      `DELETE FROM facility_maintenance WHERE id = $1 AND business_id = $2 RETURNING id`,
      id,
      ctx.businessId
    );
    if (!r.length) fail(404, "not found");
    return { success: true, id };
  });
}
