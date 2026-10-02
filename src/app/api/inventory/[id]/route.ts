/**
 * Inventory item GET / PUT / DELETE (apply pass 7 — backlog #1).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureInventoryTable } from "@/lib/db-pass7";
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
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    await ensureInventoryTable();
    const { id: idRaw } = await params;
    const id = parseId(idRaw);
    if (id == null) fail(400, "invalid id");

    const r: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM inventory WHERE id = $1 AND business_id = $2`,
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
    await ensureInventoryTable();
    const { id: idRaw } = await params;
    const id = parseId(idRaw);
    if (id == null) fail(400, "invalid id");

    const body = await req.json().catch(() => ({}));
    const allowed: Record<string, string> = {
      sku: "sku",
      name: "name",
      description: "description",
      category: "category",
      unit: "unit",
      quantityOnHand: "quantity_on_hand",
      reorderLevel: "reorder_level",
      reorderQuantity: "reorder_quantity",
      unitCost: "unit_cost",
      supplierId: "supplier_id",
      location: "location",
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
      `UPDATE inventory SET ${sets.join(", ")} WHERE id = $${idParam} AND business_id = $${businessParam} RETURNING *`,
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
    await ensureInventoryTable();
    const { id: idRaw } = await params;
    const id = parseId(idRaw);
    if (id == null) fail(400, "invalid id");

    const r: any[] = await prisma.$queryRawUnsafe(
      `DELETE FROM inventory WHERE id = $1 AND business_id = $2 RETURNING id`,
      id,
      ctx.businessId
    );
    if (!r.length) fail(404, "not found");
    return { success: true, id };
  });
}
