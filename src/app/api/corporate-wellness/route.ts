/**
 * Corporate wellness programs (apply pass 5 — PRODUCT-DECISION).
 *
 * PRODUCT-DECISION: a corporate wellness "program" is modelled as a parent record
 * with N member clients. Members reuse the existing `Client` table via `client_id`.
 * No multi-tenant Business hierarchy is introduced; the program is scoped to a
 * single business via `business_id`.
 *
 * Schema: `corporate_wellness_programs`, `corporate_wellness_members`. Both via
 * raw `CREATE TABLE IF NOT EXISTS`.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let ensured = false;
async function ensure() {
  if (ensured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS corporate_wellness_programs (
      id SERIAL PRIMARY KEY,
      business_id TEXT,
      name TEXT NOT NULL,
      sponsor_company TEXT,
      starts_at TIMESTAMP,
      ends_at TIMESTAMP,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS corporate_wellness_members (
      id SERIAL PRIMARY KEY,
      program_id INTEGER NOT NULL,
      client_id TEXT NOT NULL,
      joined_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  ensured = true;
}

export async function GET(req: NextRequest) {
  await ensure();
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  try {
    const rows: any = businessId
      ? await prisma.$queryRawUnsafe(`SELECT * FROM corporate_wellness_programs WHERE business_id = $1 ORDER BY created_at DESC`, businessId)
      : await prisma.$queryRawUnsafe(`SELECT * FROM corporate_wellness_programs ORDER BY created_at DESC LIMIT 200`);
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: "Read failed", details: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensure();
  const body = await req.json().catch(() => ({}));
  const { businessId, name, sponsorCompany, startsAt, endsAt } = body || {};
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  try {
    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO corporate_wellness_programs (business_id, name, sponsor_company, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      businessId || null, name, sponsorCompany || null,
      startsAt ? new Date(startsAt) : null, endsAt ? new Date(endsAt) : null
    );
    return NextResponse.json(r[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Create failed", details: e.message }, { status: 500 });
  }
}
