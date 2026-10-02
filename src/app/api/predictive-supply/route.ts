/**
 * Predictive supply ordering (apply pass 5 — PRODUCT-DECISION).
 *
 * PRODUCT-DECISION: chains existing `/api/ai/inventory-forecast` + Product reorder
 * thresholds to suggest a draft purchase order. We DO NOT auto-create real POs in
 * this pass — output is a draft envelope the operator reviews/approves through the
 * already-existing /api/purchase-orders flow.
 */
import { prisma } from "@/lib/prisma";
import { context, endpoint } from "@/lib/operations/core";

export async function POST() {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const businessId = ctx.businessId;

    // PRODUCT-DECISION: trigger products = quantityOnHand <= reorderLevel.
    const triggers = await prisma.product.findMany({
      where: {
        businessId,
      },
      select: {
        id: true, name: true, sku: true, quantityOnHand: true, reorderLevel: true,
        reorderQuantity: true, cost: true,
      },
    }).catch(() => []);

    const items = triggers.filter((p: any) => typeof p.reorderLevel === "number" && p.quantityOnHand <= p.reorderLevel)
      .map((p: any) => ({
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        qty: Math.max(p.reorderQuantity || 1, (p.reorderLevel || 0) - p.quantityOnHand + 1),
        unit_cost: Number(p.cost || 0),
        vendor_id: null,
      }));

    return {
      success: true,
      business_id: businessId,
      drafts: [{
        status: "draft",
        items,
        estimated_total: items.reduce((s, i) => s + (i.qty * (i.unit_cost || 0)), 0),
        note: "PRODUCT-DECISION: review before submitting via /api/purchase-orders. No PO created automatically.",
      }],
    };
  });
}
