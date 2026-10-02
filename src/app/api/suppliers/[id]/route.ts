/**
 * Supplier GET / PUT / DELETE (apply pass 7 — backlog #2).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSuppliersTable } from "@/lib/db-pass7";
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
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    await ensureSuppliersTable();
    const { id: idRaw } = await params;
    const id = parseId(idRaw);
    if (id == null) fail(400, "invalid id");

    const r: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM suppliers WHERE id = $1 AND business_id = $2`,
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
    const ctx = await context(["OWNER", "MANAGER"]);
    await ensureSuppliersTable();
    const { id: idRaw } = await params;
    const id = parseId(idRaw);
    if (id == null) fail(400, "invalid id");

    const body = await req.json().catch(() => ({}));
    const allowed: Record<string, string> = {
      name: "name",
      contactName: "contact_name",
      email: "email",
      phone: "phone",
      address: "address",
      category: "category",
      paymentTerms: "payment_terms",
      leadTimeDays: "lead_time_days",
      notes: "notes",
      active: "active",
    };
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [k, col] of Object.entries(allowed)) {
      if (k in body) {
        sets.push(`${col} = $${i++}`);
        vals.push(body[k]);
      }
    }
    if (!sets.length) fail(400, "no fields to update");
    sets.push(`updated_at = NOW()`);
    const idParam = i++;
    const businessParam = i++;
    vals.push(id, ctx.businessId);

    const r: any[] = await prisma.$queryRawUnsafe(
      `UPDATE suppliers SET ${sets.join(", ")} WHERE id = $${idParam} AND business_id = $${businessParam} RETURNING *`,
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
    const ctx = await context(["OWNER", "MANAGER"]);
    await ensureSuppliersTable();
    const { id: idRaw } = await params;
    const id = parseId(idRaw);
    if (id == null) fail(400, "invalid id");

    const r: any[] = await prisma.$queryRawUnsafe(
      `DELETE FROM suppliers WHERE id = $1 AND business_id = $2 RETURNING id`,
      id,
      ctx.businessId
    );
    if (!r.length) fail(404, "not found");
    return { success: true, id };
  });
}
