/**
 * Corporate wellness enrollments CRUD (apply pass 7 — backlog #5).
 *
 * PRODUCT-DECISION: tenant scoping is enforced by `client_org_id`. Callers MUST
 * supply `clientOrgId` on POST so a misconfigured caller cannot accidentally
 * mix tenants. List queries also require `clientOrgId` OR `programId` to
 * prevent cross-tenant reads.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCorporateWellnessEnrollmentsTable } from "@/lib/db-pass7";

export async function GET(req: NextRequest) {
  await ensureCorporateWellnessEnrollmentsTable();
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId");
  const clientOrgId = searchParams.get("clientOrgId");
  if (!programId && !clientOrgId) {
    return NextResponse.json(
      {
        error:
          "clientOrgId or programId required to prevent cross-tenant reads",
      },
      { status: 400 }
    );
  }
  try {
    const clauses: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (programId) {
      clauses.push(`program_id = $${i++}`);
      vals.push(parseInt(programId, 10));
    }
    if (clientOrgId) {
      clauses.push(`client_org_id = $${i++}`);
      vals.push(clientOrgId);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM corporate_wellness_enrollments ${where} ORDER BY enrolled_at DESC LIMIT 1000`,
      ...vals
    );
    return NextResponse.json({ count: rows.length, items: rows });
  } catch (e: any) {
    return NextResponse.json(
      { error: "enrollments read failed", details: e.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await ensureCorporateWellnessEnrollmentsTable();
  const body = await req.json().catch(() => ({}));
  const { programId, clientOrgId, clientId, memberEmail, memberName, notes } =
    body || {};
  if (!programId) {
    return NextResponse.json({ error: "programId required" }, { status: 400 });
  }
  if (!clientOrgId) {
    return NextResponse.json(
      { error: "clientOrgId required for tenant isolation" },
      { status: 400 }
    );
  }
  try {
    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO corporate_wellness_enrollments
       (program_id, client_org_id, client_id, member_email, member_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      parseInt(programId, 10),
      clientOrgId,
      clientId || null,
      memberEmail || null,
      memberName || null,
      notes || null
    );
    return NextResponse.json(r[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "enrollment create failed", details: e.message },
      { status: 500 }
    );
  }
}
