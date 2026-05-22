/**
 * Inventory CRUD (apply pass 7 — backlog #1).
 *
 * Pass 5 only exposed a read-only Product wrapper here. Pass 7 introduces a
 * dedicated `inventory` table (see `src/lib/db-pass7.ts`) with full CRUD so
 * non-AI plain inventory items (consumables, supplies, retail SKUs not in the
 * Product catalog) can be tracked. The existing Product surface remains the
 * source of truth for retail catalog; `inventory` is operational stock.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureInventoryTable } from "@/lib/db-pass7";

// GET /api/inventory?businessId=...&low=1
export async function GET(req: NextRequest) {
  await ensureInventoryTable();
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const lowOnly = searchParams.get("low") === "1";

  try {
    const rows: any = businessId
      ? await prisma.$queryRawUnsafe(
          `SELECT * FROM inventory WHERE business_id = $1 ORDER BY name ASC LIMIT 1000`,
          businessId
        )
      : await prisma.$queryRawUnsafe(
          `SELECT * FROM inventory ORDER BY name ASC LIMIT 1000`
        );

    const filtered = lowOnly
      ? rows.filter(
          (r: any) =>
            r.reorder_level != null &&
            Number(r.quantity_on_hand) <= Number(r.reorder_level)
        )
      : rows;

    return NextResponse.json({
      count: filtered.length,
      low_stock_count: rows.filter(
        (r: any) =>
          r.reorder_level != null &&
          Number(r.quantity_on_hand) <= Number(r.reorder_level)
      ).length,
      items: filtered,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Inventory read failed", details: e.message },
      { status: 500 }
    );
  }
}

// POST /api/inventory
export async function POST(req: NextRequest) {
  await ensureInventoryTable();
  const body = await req.json().catch(() => ({}));
  const {
    businessId,
    sku,
    name,
    description,
    category,
    unit,
    quantityOnHand,
    reorderLevel,
    reorderQuantity,
    unitCost,
    supplierId,
    location,
    notes,
  } = body || {};

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  try {
    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO inventory
       (business_id, sku, name, description, category, unit,
        quantity_on_hand, reorder_level, reorder_quantity, unit_cost,
        supplier_id, location, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      businessId || null,
      sku || null,
      name,
      description || null,
      category || null,
      unit || null,
      quantityOnHand ?? 0,
      reorderLevel ?? null,
      reorderQuantity ?? null,
      unitCost ?? null,
      supplierId ?? null,
      location || null,
      notes || null
    );
    return NextResponse.json(r[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Inventory create failed", details: e.message },
      { status: 500 }
    );
  }
}
