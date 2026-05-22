/**
 * Facility maintenance CRUD (apply pass 7 — backlog #3).
 *
 * Replaces the pass-5 read-only stub. Backed by a dedicated `facility_maintenance`
 * table (see `src/lib/db-pass7.ts`) with `scheduled_date`, priority, recurrence
 * and cost tracking. Pass 5's `facility_maintenance_tasks` table is left in place
 * but is no longer accessed from any route.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureFacilityMaintenanceTable } from "@/lib/db-pass7";

export async function GET(req: NextRequest) {
  await ensureFacilityMaintenanceTable();
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const status = searchParams.get("status");
  try {
    const clauses: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (businessId) {
      clauses.push(`business_id = $${i++}`);
      vals.push(businessId);
    }
    if (status) {
      clauses.push(`status = $${i++}`);
      vals.push(status);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const sql = `SELECT * FROM facility_maintenance ${where} ORDER BY scheduled_date ASC NULLS LAST LIMIT 500`;
    const rows: any = await prisma.$queryRawUnsafe(sql, ...vals);
    return NextResponse.json({ count: rows.length, items: rows });
  } catch (e: any) {
    return NextResponse.json(
      { error: "facility maintenance read failed", details: e.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await ensureFacilityMaintenanceTable();
  const body = await req.json().catch(() => ({}));
  const {
    businessId,
    locationId,
    title,
    description,
    category,
    priority,
    scheduledDate,
    recurrence,
    assignee,
    vendor,
    estimatedCost,
    notes,
  } = body || {};
  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  try {
    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO facility_maintenance
       (business_id, location_id, title, description, category, priority,
        scheduled_date, recurrence, assignee, vendor, estimated_cost, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      businessId || null,
      locationId || null,
      title,
      description || null,
      category || null,
      priority || "normal",
      scheduledDate ? new Date(scheduledDate) : null,
      recurrence || null,
      assignee || null,
      vendor || null,
      estimatedCost ?? null,
      notes || null
    );
    return NextResponse.json(r[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "facility maintenance create failed", details: e.message },
      { status: 500 }
    );
  }
}
