/**
 * Facility maintenance scheduling (apply pass 5 — additive only).
 *
 * TOO-RISKY in audit because it requires schema + UI; this implementation only adds
 * a `facility_maintenance_tasks` table via raw SQL `CREATE TABLE IF NOT EXISTS` and
 * a minimal CRUD wrapper. No Prisma schema is touched. Rows are addressed by integer
 * id from a SERIAL.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let tableEnsured = false;
async function ensureTable() {
  if (tableEnsured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS facility_maintenance_tasks (
      id SERIAL PRIMARY KEY,
      business_id TEXT,
      location_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      kind TEXT,
      frequency TEXT,
      next_due TIMESTAMP,
      status TEXT DEFAULT 'open',
      assignee_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  tableEnsured = true;
}

export async function GET(req: NextRequest) {
  await ensureTable();
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  try {
    const rows: any = businessId
      ? await prisma.$queryRawUnsafe(
          `SELECT * FROM facility_maintenance_tasks WHERE business_id = $1 ORDER BY next_due ASC NULLS LAST LIMIT 500`,
          businessId
        )
      : await prisma.$queryRawUnsafe(
          `SELECT * FROM facility_maintenance_tasks ORDER BY next_due ASC NULLS LAST LIMIT 500`
        );
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to list", details: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureTable();
  try {
    const body = await req.json();
    const { businessId, locationId, title, description, kind, frequency, nextDue, assigneeId } = body || {};
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO facility_maintenance_tasks (business_id, location_id, title, description, kind, frequency, next_due, assignee_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      businessId || null, locationId || null, title, description || null,
      kind || null, frequency || null, nextDue ? new Date(nextDue) : null, assigneeId || null
    );
    return NextResponse.json(r[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to create", details: e.message }, { status: 500 });
  }
}
