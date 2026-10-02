/**
 * Corporate wellness programs CRUD (apply pass 7 — backlog #5).
 *
 * PRODUCT-DECISION: multi-tenant client hierarchy is modeled as a `client_org_id`
 * column on both programs and enrollments. `client_org_id` is an opaque tenant
 * tag inside a single business; the owning business is always the authenticated
 * caller's `businessId`, never a caller-supplied value.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint } from "@/lib/operations/core";
import { ensureCorporateWellnessProgramsTable } from "@/lib/db-pass7";

const programInput = z.object({
  clientOrgId: z.string().trim().min(1).max(191),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  budget: z.coerce.number().finite().nonnegative().max(1_000_000).optional().nullable(),
  seatCount: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
  contactEmail: z
    .union([z.string().email().max(200), z.literal("")])
    .optional()
    .nullable(),
});

export async function GET(req: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    await ensureCorporateWellnessProgramsTable();
    const { searchParams } = new URL(req.url);
    const clientOrgId = searchParams.get("clientOrgId");

    const clauses: string[] = ["business_id = $1"];
    const vals: any[] = [ctx.businessId];
    let i = 2;
    if (clientOrgId) {
      clauses.push(`client_org_id = $${i++}`);
      vals.push(clientOrgId);
    }
    const where = `WHERE ${clauses.join(" AND ")}`;
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM corporate_wellness_programs ${where} ORDER BY created_at DESC LIMIT 500`,
      ...vals
    );
    return { count: rows.length, items: rows };
  });
}

export async function POST(req: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    await ensureCorporateWellnessProgramsTable();
    const input = programInput.parse(await req.json().catch(() => ({})));

    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO corporate_wellness_programs
       (business_id, client_org_id, name, description, starts_at, ends_at,
        budget, seat_count, contact_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      ctx.businessId,
      input.clientOrgId,
      input.name,
      input.description || null,
      input.startsAt ?? null,
      input.endsAt ?? null,
      input.budget ?? null,
      input.seatCount ?? null,
      input.contactEmail || null
    );
    return r[0];
  });
}
