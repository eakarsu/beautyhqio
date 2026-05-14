/**
 * Plain (non-AI) inventory endpoint (apply pass 5 — PRODUCT-DECISION).
 *
 * PRODUCT-DECISION: the audit flagged "no /api/inventory directory; only AI
 * optimizer endpoints exist". Rather than introduce a new schema, this route
 * surfaces a thin wrapper over the existing Product model with a stock-focused
 * view (sku, quantityOnHand, reorderLevel, reorderQty, unitCost, vendorId).
 * Use /api/products for full CRUD; this endpoint is read-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const lowOnly = searchParams.get("low") === "1";
  try {
    const where: any = {};
    if (businessId) where.businessId = businessId;

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true, sku: true, name: true, quantityOnHand: true,
        reorderLevel: true, reorderQuantity: true, cost: true, price: true,
        category: { select: { name: true } },
      },
      orderBy: [{ name: "asc" }],
      take: 1000,
    });

    const filtered = lowOnly
      ? products.filter((p: any) => typeof p.reorderLevel === "number" && p.quantityOnHand <= p.reorderLevel)
      : products;

    return NextResponse.json({
      count: filtered.length,
      low_stock_count: products.filter((p: any) => typeof p.reorderLevel === "number" && p.quantityOnHand <= p.reorderLevel).length,
      items: filtered,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Inventory read failed", details: e.message }, { status: 500 });
  }
}
