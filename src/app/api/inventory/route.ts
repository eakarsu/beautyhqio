/**
 * Inventory CRUD (apply pass 7 — backlog #1).
 *
 * Operational stock is held in the dedicated `inventory` table (see
 * `src/lib/db-pass7.ts`). The canonical retail catalog remains the Product
 * surface. All reads and writes are scoped to the authenticated caller's
 * `businessId`.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint } from "@/lib/operations/core";
import { ensureInventoryTable } from "@/lib/db-pass7";

const inventoryInput = z.object({
  sku: z.string().trim().max(100).optional().nullable(),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  unit: z.string().trim().max(50).optional().nullable(),
  quantityOnHand: z.coerce.number().finite().min(-1_000_000).max(1_000_000).optional(),
  reorderLevel: z.coerce.number().finite().min(0).max(1_000_000).optional().nullable(),
  reorderQuantity: z.coerce.number().finite().min(0).max(1_000_000).optional().nullable(),
  unitCost: z.coerce.number().finite().nonnegative().max(1_000_000).optional().nullable(),
  supplierId: z.coerce.number().int().optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

// GET /api/inventory?low=1
export async function GET(req: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    await ensureInventoryTable();
    const { searchParams } = new URL(req.url);
    const lowOnly = searchParams.get("low") === "1";

    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM inventory WHERE business_id = $1 ORDER BY name ASC LIMIT 1000`,
      ctx.businessId
    );

    const isLow = (r: any) =>
      r.reorder_level != null && Number(r.quantity_on_hand) <= Number(r.reorder_level);

    const filtered = lowOnly ? rows.filter(isLow) : rows;

    return {
      count: filtered.length,
      low_stock_count: rows.filter(isLow).length,
      items: filtered,
    };
  });
}

// POST /api/inventory
export async function POST(req: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    await ensureInventoryTable();
    const input = inventoryInput.parse(await req.json().catch(() => ({})));

    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO inventory
       (business_id, sku, name, description, category, unit,
        quantity_on_hand, reorder_level, reorder_quantity, unit_cost,
        supplier_id, location, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      ctx.businessId,
      input.sku || null,
      input.name,
      input.description || null,
      input.category || null,
      input.unit || null,
      input.quantityOnHand ?? 0,
      input.reorderLevel ?? null,
      input.reorderQuantity ?? null,
      input.unitCost ?? null,
      input.supplierId ?? null,
      input.location || null,
      input.notes || null
    );
    return r[0];
  });
}
