/**
 * Suppliers CRUD (apply pass 7 — backlog #2).
 *
 * The Prisma `Vendor` model already exists (used by `/api/purchase-orders`).
 * This route adds a separate `suppliers` table to capture supplier metadata
 * that does NOT belong on Vendor (lead time, preferred category, etc.) and to
 * support the predictive-supply-ordering chain without altering Prisma schema.
 *
 * All reads and writes are scoped to the authenticated caller's `businessId`.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint } from "@/lib/operations/core";
import { ensureSuppliersTable } from "@/lib/db-pass7";

const supplierInput = z.object({
  name: z.string().trim().min(1).max(200),
  contactName: z.string().trim().max(200).optional().nullable(),
  email: z
    .union([z.string().email().max(200), z.literal("")])
    .optional()
    .nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  paymentTerms: z.string().trim().max(200).optional().nullable(),
  leadTimeDays: z.coerce.number().int().min(0).max(3650).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    await ensureSuppliersTable();
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM suppliers WHERE business_id = $1 ORDER BY name ASC LIMIT 500`,
      ctx.businessId
    );
    return { count: rows.length, items: rows };
  });
}

export async function POST(req: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    await ensureSuppliersTable();
    const input = supplierInput.parse(await req.json().catch(() => ({})));

    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO suppliers
       (business_id, name, contact_name, email, phone, address,
        category, payment_terms, lead_time_days, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      ctx.businessId,
      input.name,
      input.contactName || null,
      input.email || null,
      input.phone || null,
      input.address || null,
      input.category || null,
      input.paymentTerms || null,
      input.leadTimeDays ?? null,
      input.notes || null
    );
    return r[0];
  });
}
