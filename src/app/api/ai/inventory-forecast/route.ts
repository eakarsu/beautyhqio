import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

// POST /api/ai/inventory-forecast - AI-powered inventory forecasting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { daysAhead = 30 } = body;

    // Get all products with inventory tracking
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        trackInventory: true,
      },
      include: {
        category: true,
        lineItems: {
          where: {
            transaction: {
              date: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
              },
              status: "COMPLETED",
            },
          },
          include: {
            transaction: {
              select: { date: true },
            },
          },
        },
      },
    });

    // Calculate sales velocity for each product
    const productAnalysis = products.map((product) => {
      const salesByWeek: Record<string, number> = {};
      let totalSold = 0;

      product.lineItems.forEach((item) => {
        const weekStart = getWeekStart(item.transaction.date);
        salesByWeek[weekStart] = (salesByWeek[weekStart] || 0) + item.quantity;
        totalSold += item.quantity;
      });

      const weeks = Object.keys(salesByWeek).length || 1;
      const avgWeeklySales = totalSold / weeks;
      const daysOfStock =
        avgWeeklySales > 0
          ? Math.floor((product.quantityOnHand / avgWeeklySales) * 7)
          : Infinity;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        brand: product.brand,
        category: product.category?.name || "Uncategorized",
        currentStock: product.quantityOnHand,
        reorderLevel: product.reorderLevel,
        reorderQuantity: product.reorderQuantity,
        cost: product.cost ? Number(product.cost) : null,
        price: Number(product.price),
        totalSold90Days: totalSold,
        avgWeeklySales: Math.round(avgWeeklySales * 10) / 10,
        daysOfStock: daysOfStock === Infinity ? "No sales" : daysOfStock,
        needsReorder: product.quantityOnHand <= product.reorderLevel,
        salesTrend: calculateTrend(salesByWeek),
      };
    });

    // Identify products needing attention
    const lowStock = productAnalysis.filter((p) => p.needsReorder);
    const outOfStock = productAnalysis.filter((p) => p.currentStock === 0);
    const overstock = productAnalysis.filter(
      (p) =>
        typeof p.daysOfStock === "number" &&
        p.daysOfStock > 180 &&
        p.currentStock > 0
    );

    // Build AI prompt
    const systemPrompt = `You are an AI inventory analyst for a beauty & wellness salon. Analyze the product data and provide actionable recommendations.

INVENTORY SUMMARY:
- Total products tracked: ${productAnalysis.length}
- Out of stock: ${outOfStock.length}
- Low stock (needs reorder): ${lowStock.length}
- Potential overstock: ${overstock.length}

LOW STOCK PRODUCTS (Action needed):
${lowStock
  .slice(0, 10)
  .map(
    (p) => `- ${p.name} (${p.sku || "No SKU"})
  Current: ${p.currentStock}, Reorder Level: ${p.reorderLevel}
  Avg Weekly Sales: ${p.avgWeeklySales}
  Days of Stock: ${p.daysOfStock}`
  )
  .join("\n")}

TOP SELLING PRODUCTS (Last 90 days):
${productAnalysis
  .sort((a, b) => b.totalSold90Days - a.totalSold90Days)
  .slice(0, 5)
  .map(
    (p) => `- ${p.name}: ${p.totalSold90Days} units sold, ${p.currentStock} in stock`
  )
  .join("\n")}

SLOW MOVING PRODUCTS:
${overstock
  .slice(0, 5)
  .map(
    (p) => `- ${p.name}: ${p.currentStock} in stock, ${p.avgWeeklySales} avg weekly sales`
  )
  .join("\n")}

INSTRUCTIONS:
Provide inventory recommendations for the next ${daysAhead} days. Include:
1. Immediate reorder recommendations with quantities
2. Products at risk of stockout
3. Slow-moving inventory suggestions
4. Seasonal or promotional opportunities

Respond in JSON format:
{
  "urgentReorders": [
    {"productName": "name", "currentStock": 0, "recommendedOrder": 50, "reason": "reason"}
  ],
  "stockoutRisk": [
    {"productName": "name", "daysUntilStockout": 5, "action": "recommended action"}
  ],
  "slowMovers": [
    {"productName": "name", "suggestion": "discount or bundle suggestion"}
  ],
  "insights": ["insight 1", "insight 2"],
  "estimatedReorderCost": 0.00
}`;

    const response = await openRouterChat([
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Please analyze my inventory and provide recommendations for the next ${daysAhead} days.`,
      },
    ]);

    // Parse AI response
    let aiAnalysis;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      aiAnalysis = {
        urgentReorders: lowStock.slice(0, 5).map((p) => ({
          productName: p.name,
          currentStock: p.currentStock,
          recommendedOrder: p.reorderQuantity || 10,
          reason: "Below reorder level",
        })),
        stockoutRisk: [],
        slowMovers: [],
        insights: [response],
        estimatedReorderCost: 0,
      };
    }

    // Calculate estimated reorder cost
    const reorderCost = aiAnalysis.urgentReorders?.reduce(
      (sum: number, item: { productName: string; recommendedOrder: number }) => {
        const product = productAnalysis.find(
          (p) => p.name === item.productName
        );
        return sum + (product?.cost || 0) * item.recommendedOrder;
      },
      0
    );

    return NextResponse.json({
      forecast: {
        period: `${daysAhead} days`,
        generatedAt: new Date().toISOString(),
      },
      summary: {
        totalProducts: productAnalysis.length,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        overstock: overstock.length,
        healthyStock:
          productAnalysis.length -
          outOfStock.length -
          lowStock.length -
          overstock.length,
      },
      aiAnalysis: {
        ...aiAnalysis,
        estimatedReorderCost: reorderCost,
      },
      products: {
        lowStock: lowStock.slice(0, 20),
        outOfStock: outOfStock,
        topSellers: productAnalysis
          .sort((a, b) => b.totalSold90Days - a.totalSold90Days)
          .slice(0, 10),
        slowMovers: overstock.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Error in inventory forecast:", error);
    return NextResponse.json(
      { error: "Failed to generate inventory forecast" },
      { status: 500 }
    );
  }
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function calculateTrend(
  salesByWeek: Record<string, number>
): "increasing" | "decreasing" | "stable" {
  const weeks = Object.keys(salesByWeek).sort();
  if (weeks.length < 3) return "stable";

  const recentWeeks = weeks.slice(-4);
  const recentSales = recentWeeks.map((w) => salesByWeek[w]);

  const firstHalf =
    recentSales.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
  const secondHalf =
    recentSales.slice(2).reduce((a, b) => a + b, 0) / 2;

  if (secondHalf > firstHalf * 1.2) return "increasing";
  if (secondHalf < firstHalf * 0.8) return "decreasing";
  return "stable";
}
