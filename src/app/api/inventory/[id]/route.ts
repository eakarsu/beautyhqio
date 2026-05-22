/**
 * Inventory item GET / PUT / DELETE (apply pass 7 — backlog #1).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureInventoryTable } from "@/lib/db-pass7";

function parseId(idRaw: string) {
  const id = parseInt(idRaw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureInventoryTable();
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id == null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const r: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM inventory WHERE id = $1`,
      id
    );
    if (!r.length) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(r[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: "read failed", details: e.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureInventoryTable();
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id == null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

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
  if (!sets.length) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }
  sets.push(`updated_at = NOW()`);
  vals.push(id);

  try {
    const r: any = await prisma.$queryRawUnsafe(
      `UPDATE inventory SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      ...vals
    );
    if (!r.length) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(r[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: "update failed", details: e.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureInventoryTable();
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id == null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const r: any = await prisma.$queryRawUnsafe(
      `DELETE FROM inventory WHERE id = $1 RETURNING id`,
      id
    );
    if (!r.length) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    return NextResponse.json(
      { error: "delete failed", details: e.message },
      { status: 500 }
    );
  }
}
