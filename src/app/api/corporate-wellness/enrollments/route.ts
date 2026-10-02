/**
 * Corporate wellness enrollments CRUD (apply pass 7 — backlog #5).
 *
 * SECURITY: the backing table has no `business_id` column, so tenancy is
 * resolved through the parent program (`corporate_wellness_programs.business_id`)
 * rather than trusting the caller-supplied `clientOrgId`. Every read joins the
 * program and filters on the authenticated business; every write verifies the
 * program (and any referenced client) belongs to that business first.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { context, endpoint, fail } from "@/lib/operations/core";
import { prisma } from "@/lib/prisma";
import { ensureCorporateWellnessEnrollmentsTable } from "@/lib/db-pass7";

const ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;
const programIdSchema = z.coerce.number().int().positive();

export async function GET(req: NextRequest) {
  await ensureCorporateWellnessEnrollmentsTable();
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");
    const clientOrgId = searchParams.get("clientOrgId");
    if (!programId && !clientOrgId) {
      return fail(400, "clientOrgId or programId required");
    }

    const clauses: string[] = ["p.business_id = $1"];
    const vals: unknown[] = [ctx.businessId];
    if (programId) {
      clauses.push(`e.program_id = $${vals.length + 1}`);
      vals.push(programIdSchema.parse(programId));
    }
    if (clientOrgId) {
      clauses.push(`e.client_org_id = $${vals.length + 1}`);
      vals.push(clientOrgId);
    }

    const rows = await prisma.$queryRawUnsafe<unknown[]>(
      `SELECT e.* FROM corporate_wellness_enrollments e
       JOIN corporate_wellness_programs p ON p.id = e.program_id
       WHERE ${clauses.join(" AND ")}
       ORDER BY e.enrolled_at DESC LIMIT 1000`,
      ...vals
    );
    return { count: rows.length, items: rows };
  });
}

export async function POST(req: NextRequest) {
  await ensureCorporateWellnessEnrollmentsTable();
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const body = await req.json().catch(() => ({}));
    const { programId, clientOrgId, clientId, memberEmail, memberName, notes } = body || {};

    const parsedProgramId = programIdSchema.safeParse(programId);
    if (!parsedProgramId.success) return fail(400, "programId required");
    if (!clientOrgId) return fail(400, "clientOrgId required");

    const program = await prisma.$queryRawUnsafe<{ id: number }[]>(
      `SELECT id FROM corporate_wellness_programs WHERE id = $1 AND business_id = $2`,
      parsedProgramId.data,
      ctx.businessId
    );
    if (!program.length) return fail(404, "Program not found");

    if (clientId) {
      const client = await prisma.client.findFirst({
        where: { id: String(clientId), businessId: ctx.businessId },
        select: { id: true },
      });
      if (!client) return fail(404, "Client not found");
    }

    const r = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `INSERT INTO corporate_wellness_enrollments
       (program_id, client_org_id, client_id, member_email, member_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      parsedProgramId.data,
      clientOrgId,
      clientId || null,
      memberEmail || null,
      memberName || null,
      notes || null
    );
    return r[0];
  });
}
