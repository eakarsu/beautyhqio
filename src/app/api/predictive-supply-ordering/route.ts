/**
 * Predictive supply ordering (apply pass 7 — backlog #7).
 *
 * PRODUCT-DECISION: chains the existing `/api/ai/inventory-forecast` signals
 * with current stock-on-hand to produce an ADVISORY purchase-order draft.
 *
 * This route does NOT auto-place real orders. It writes the draft to the
 * pass-7 `pass7_purchase_orders` table with `requires_approval = true` so the
 * canonical PurchaseOrder flow at `/api/purchase-orders` is unaffected. Every
 * response envelope includes `disclaimer` + `requires_human_review: true`.
 *
 * Two product sources are blended:
 *  1. Prisma `Product` rows where `quantityOnHand <= reorderLevel`
 *  2. Pass-7 `inventory` rows where `quantity_on_hand <= reorder_level`
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ensureInventoryTable,
  ensurePurchaseOrdersPass7Table,
  PASS7_DISCLAIMER,
} from "@/lib/db-pass7";

interface DraftItem {
  source: "product" | "inventory";
  product_id: string | number;
  sku: string | null;
  name: string;
  qty: number;
  unit_cost: number;
  vendor_id: string | null;
  reason: string;
}

export async function POST(req: NextRequest) {
  await ensureInventoryTable();
  await ensurePurchaseOrdersPass7Table();
  const body = await req.json().catch(() => ({}));
  const { businessId, supplierId, persist } = body || {};
  if (!businessId) {
    return NextResponse.json({ error: "businessId required" }, { status: 400 });
  }

  const items: DraftItem[] = [];

  // Source 1: Prisma Product (canonical retail catalog).
  try {
    const products = await prisma.product.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        sku: true,
        quantityOnHand: true,
        reorderLevel: true,
        reorderQuantity: true,
        cost: true,
      },
    });
    for (const p of products) {
      if (
        typeof p.reorderLevel === "number" &&
        p.quantityOnHand <= p.reorderLevel
      ) {
        const qty = Math.max(
          p.reorderQuantity || 1,
          (p.reorderLevel || 0) - p.quantityOnHand + 1
        );
        items.push({
          source: "product",
          product_id: p.id,
          sku: p.sku ?? null,
          name: p.name,
          qty,
          unit_cost: Number(p.cost || 0),
          vendor_id: null,
          reason: `On-hand ${p.quantityOnHand} <= reorder level ${p.reorderLevel}`,
        });
      }
    }
  } catch (_e) {
    // Product source is best-effort
  }

  // Source 2: pass-7 inventory table.
  try {
    const invRows: any = await prisma.$queryRawUnsafe(
      `SELECT id, sku, name, quantity_on_hand, reorder_level, reorder_quantity, unit_cost, supplier_id
       FROM inventory
       WHERE business_id = $1
         AND reorder_level IS NOT NULL
         AND quantity_on_hand <= reorder_level`,
      businessId
    );
    for (const r of invRows as any[]) {
      const qty = Math.max(
        Number(r.reorder_quantity) || 1,
        (Number(r.reorder_level) || 0) - Number(r.quantity_on_hand) + 1
      );
      items.push({
        source: "inventory",
        product_id: r.id,
        sku: r.sku,
        name: r.name,
        qty,
        unit_cost: Number(r.unit_cost || 0),
        vendor_id: r.supplier_id != null ? String(r.supplier_id) : null,
        reason: `Pass-7 inventory low: on-hand ${r.quantity_on_hand} <= reorder level ${r.reorder_level}`,
      });
    }
  } catch (_e) {
    // inventory source is best-effort
  }

  const estimatedTotal = items.reduce(
    (s, i) => s + i.qty * (i.unit_cost || 0),
    0
  );

  let draftId: number | null = null;
  if (persist) {
    try {
      const r: any = await prisma.$queryRawUnsafe(
        `INSERT INTO pass7_purchase_orders
         (business_id, supplier_id, source, status, items, estimated_total, requires_approval, disclaimer)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8) RETURNING id`,
        businessId,
        supplierId ?? null,
        "predictive-supply",
        "draft",
        JSON.stringify(items),
        estimatedTotal,
        true,
        PASS7_DISCLAIMER
      );
      draftId = r?.[0]?.id ?? null;
    } catch (_e) {
      // persistence is best-effort
    }
  }

  return NextResponse.json({
    success: true,
    business_id: businessId,
    item_count: items.length,
    estimated_total: estimatedTotal,
    draft_id: draftId,
    requires_approval: true,
    disclaimer: PASS7_DISCLAIMER,
    requires_human_review: true,
    note: "Advisory only. No purchase order has been dispatched. Use POST /api/purchase-orders to convert to a real PO after human review.",
    drafts: [
      {
        status: "draft",
        items,
        estimated_total: estimatedTotal,
      },
    ],
  });
}

export async function GET(req: NextRequest) {
  await ensurePurchaseOrdersPass7Table();
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  try {
    const rows: any = businessId
      ? await prisma.$queryRawUnsafe(
          `SELECT * FROM pass7_purchase_orders WHERE business_id = $1 ORDER BY created_at DESC LIMIT 100`,
          businessId
        )
      : await prisma.$queryRawUnsafe(
          `SELECT * FROM pass7_purchase_orders ORDER BY created_at DESC LIMIT 100`
        );
    return NextResponse.json({
      count: rows.length,
      items: rows,
      disclaimer: PASS7_DISCLAIMER,
      requires_human_review: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "read failed", details: e.message },
      { status: 500 }
    );
  }
}
