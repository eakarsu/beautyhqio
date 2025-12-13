import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reports/inventory - Inventory report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    const where: Record<string, unknown> = {};
    if (businessId) where.businessId = businessId;

    // Get all products with categories
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        brand: true,
        quantityOnHand: true,
        reorderLevel: true,
        reorderQuantity: true,
        cost: true,
        price: true,
        isActive: true,
        category: {
          select: { name: true },
        },
      },
    });

    // Calculate inventory metrics
    const inventory = products.map((product) => {
      const stockLevel = product.quantityOnHand;
      const reorderLevel = product.reorderLevel || 5;
      const cost = Number(product.cost || 0);
      const price = Number(product.price);

      let status = "normal";
      if (stockLevel <= 0) status = "out_of_stock";
      else if (stockLevel <= reorderLevel) status = "low_stock";

      return {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category?.name || "Uncategorized",
          brand: product.brand,
          isActive: product.isActive,
        },
        stock: {
          current: stockLevel,
          reorderLevel,
          reorderQuantity: product.reorderQuantity || 10,
          status,
        },
        value: {
          cost,
          price,
          totalCost: stockLevel * cost,
          totalRetail: stockLevel * price,
          margin: price > 0 ? ((price - cost) / price) * 100 : 0,
        },
      };
    });

    // Summary statistics
    const outOfStock = inventory.filter((i) => i.stock.status === "out_of_stock");
    const lowStock = inventory.filter((i) => i.stock.status === "low_stock");

    const totalInventoryValue = inventory.reduce(
      (sum, i) => sum + i.value.totalCost,
      0
    );
    const totalRetailValue = inventory.reduce(
      (sum, i) => sum + i.value.totalRetail,
      0
    );

    // Group by category
    const byCategory: Record<
      string,
      { count: number; units: number; value: number }
    > = {};
    for (const item of inventory) {
      const cat = item.product.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { count: 0, units: 0, value: 0 };
      }
      byCategory[cat].count += 1;
      byCategory[cat].units += item.stock.current;
      byCategory[cat].value += item.value.totalCost;
    }

    // Group by brand
    const byBrand: Record<
      string,
      { count: number; units: number; value: number }
    > = {};
    for (const item of inventory) {
      const brand = item.product.brand || "No Brand";
      if (!byBrand[brand]) {
        byBrand[brand] = { count: 0, units: 0, value: 0 };
      }
      byBrand[brand].count += 1;
      byBrand[brand].units += item.stock.current;
      byBrand[brand].value += item.value.totalCost;
    }

    return NextResponse.json({
      summary: {
        totalProducts: products.length,
        activeProducts: products.filter((p) => p.isActive).length,
        totalUnits: inventory.reduce((sum, i) => sum + i.stock.current, 0),
        totalInventoryValue,
        totalRetailValue,
        potentialProfit: totalRetailValue - totalInventoryValue,
      },
      alerts: {
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        outOfStockItems: outOfStock.map((i) => i.product),
        lowStockItems: lowStock.map((i) => ({
          ...i.product,
          currentStock: i.stock.current,
          reorderLevel: i.stock.reorderLevel,
        })),
      },
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        ...data,
      })),
      byBrand: Object.entries(byBrand).map(([brand, data]) => ({
        brand,
        ...data,
      })),
      products: inventory,
    });
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
