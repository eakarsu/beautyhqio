/**
 * Corporate wellness programs CRUD (apply pass 7 — backlog #5).
 *
 * PRODUCT-DECISION: multi-tenant client hierarchy is modeled as a `client_org_id`
 * column on both programs and enrollments. The actual client org directory is
 * out of scope; this endpoint treats `client_org_id` as an opaque tenant tag
 * that callers must filter by for tenant isolation.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCorporateWellnessProgramsTable } from "@/lib/db-pass7";

export async function GET(req: NextRequest) {
  await ensureCorporateWellnessProgramsTable();
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const clientOrgId = searchParams.get("clientOrgId");
  try {
    const clauses: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (businessId) {
      clauses.push(`business_id = $${i++}`);
      vals.push(businessId);
    }
    if (clientOrgId) {
      clauses.push(`client_org_id = $${i++}`);
      vals.push(clientOrgId);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM corporate_wellness_programs ${where} ORDER BY created_at DESC LIMIT 500`,
      ...vals
    );
    return NextResponse.json({ count: rows.length, items: rows });
  } catch (e: any) {
    return NextResponse.json(
      { error: "programs read failed", details: e.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await ensureCorporateWellnessProgramsTable();
  const body = await req.json().catch(() => ({}));
  const {
    businessId,
    clientOrgId,
    name,
    description,
    startsAt,
    endsAt,
    budget,
    seatCount,
    contactEmail,
  } = body || {};
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  if (!clientOrgId) {
    return NextResponse.json(
      { error: "clientOrgId required for multi-tenant isolation" },
      { status: 400 }
    );
  }
  try {
    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO corporate_wellness_programs
       (business_id, client_org_id, name, description, starts_at, ends_at,
        budget, seat_count, contact_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      businessId || null,
      clientOrgId,
      name,
      description || null,
      startsAt ? new Date(startsAt) : null,
      endsAt ? new Date(endsAt) : null,
      budget ?? null,
      seatCount ?? null,
      contactEmail || null
    );
    return NextResponse.json(r[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "program create failed", details: e.message },
      { status: 500 }
    );
  }
}
