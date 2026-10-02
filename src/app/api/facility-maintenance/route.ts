/**
 * Facility maintenance CRUD (apply pass 7 — backlog #3).
 *
 * Backed by the dedicated `facility_maintenance` table (see `src/lib/db-pass7.ts`).
 * All reads and writes are scoped to the authenticated caller's `businessId`.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";
import { ensureFacilityMaintenanceTable } from "@/lib/db-pass7";

const maintenanceInput = z.object({
  locationId: z.string().trim().max(191).optional().nullable(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  priority: z.string().trim().max(40).optional().nullable(),
  scheduledDate: z.coerce.date().optional().nullable(),
  recurrence: z.string().trim().max(100).optional().nullable(),
  assignee: z.string().trim().max(200).optional().nullable(),
  vendor: z.string().trim().max(200).optional().nullable(),
  estimatedCost: z.coerce.number().finite().nonnegative().max(1_000_000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    await ensureFacilityMaintenanceTable();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const clauses: string[] = ["business_id = $1"];
    const vals: any[] = [ctx.businessId];
    let i = 2;
    if (status) {
      clauses.push(`status = $${i++}`);
      vals.push(status);
    }
    const sql = `SELECT * FROM facility_maintenance WHERE ${clauses.join(" AND ")} ORDER BY scheduled_date ASC NULLS LAST LIMIT 500`;
    const rows: any = await prisma.$queryRawUnsafe(sql, ...vals);
    return { count: rows.length, items: rows };
  });
}

export async function POST(req: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    await ensureFacilityMaintenanceTable();
    const input = maintenanceInput.parse(await req.json().catch(() => ({})));

    if (input.locationId) {
      const location = await prisma.location.findFirst({
        where: { id: input.locationId, businessId: ctx.businessId },
        select: { id: true },
      });
      if (!location) return fail(404, "Location not found");
    }

    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO facility_maintenance
       (business_id, location_id, title, description, category, priority,
        scheduled_date, recurrence, assignee, vendor, estimated_cost, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      ctx.businessId,
      input.locationId || null,
      input.title,
      input.description || null,
      input.category || null,
      input.priority || "normal",
      input.scheduledDate ?? null,
      input.recurrence || null,
      input.assignee || null,
      input.vendor || null,
      input.estimatedCost ?? null,
      input.notes || null
    );
    return r[0];
  });
}
