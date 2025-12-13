import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

// POST /api/ai/upsell-suggestions - Get AI-powered upsell suggestions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, appointmentId, currentServices } = body;

    if (!currentServices?.length && !appointmentId) {
      return NextResponse.json(
        { error: "currentServices or appointmentId is required" },
        { status: 400 }
      );
    }

    // Get current services from appointment if provided
    let services = currentServices || [];
    if (appointmentId && !services.length) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          services: {
            include: {
              service: {
                select: { name: true, price: true, categoryId: true },
              },
            },
          },
        },
      });

      if (appointment) {
        services = appointment.services.map((s) => ({
          name: s.service.name,
          price: Number(s.service.price),
          categoryId: s.service.categoryId,
        }));
      }
    }

    // Get client history for personalization
    let clientContext = "";
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          appointments: {
            where: { status: "COMPLETED" },
            orderBy: { scheduledStart: "desc" },
            take: 10,
            include: {
              services: {
                include: {
                  service: { select: { name: true } },
                },
              },
            },
          },
          transactions: {
            orderBy: { date: "desc" },
            take: 5,
            include: {
              lineItems: {
                where: { type: "PRODUCT" },
                select: { name: true, quantity: true },
              },
            },
          },
        },
      });

      if (client) {
        const pastServices = client.appointments
          .flatMap((a) => a.services.map((s) => s.service.name));

        const purchasedProducts = client.transactions
          .flatMap((t) => t.lineItems.map((li) => li.name));

        clientContext = `
CLIENT HISTORY:
- Past services (last 10 visits): ${[...new Set(pastServices)].join(", ") || "None"}
- Products purchased: ${[...new Set(purchasedProducts)].join(", ") || "None"}
`;
      }
    }

    // Get all available services and add-ons
    const allServices = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        addOns: { where: { isActive: true } },
      },
    });

    // Get products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        name: true,
        price: true,
        brand: true,
        category: { select: { name: true } },
      },
      take: 50,
    });

    const currentServiceNames = services.map((s: { name: string }) => s.name).join(", ");

    const systemPrompt = `You are an AI upsell assistant for a beauty & wellness salon. Based on the client's current booking and history, suggest relevant add-on services and products that would enhance their experience.

CURRENT BOOKING:
${currentServiceNames}

${clientContext}

AVAILABLE ADD-ON SERVICES:
${allServices
  .filter((s) => !services.find((cs: { name: string }) => cs.name === s.name))
  .map(
    (s) =>
      `- ${s.name} (${s.category?.name || "General"}): $${Number(s.price)}, ${s.duration} min\n  Add-ons: ${s.addOns.map((a) => `${a.name} +$${Number(a.price)}`).join(", ") || "None"}`
  )
  .join("\n")}

RETAIL PRODUCTS:
${products.map((p) => `- ${p.name} (${p.brand || "House"}): $${Number(p.price)} - ${p.category?.name || "General"}`).join("\n")}

INSTRUCTIONS:
Suggest 2-3 add-on services and 2-3 products that would complement their current booking. Consider:
1. Services that pair well together (e.g., haircut + deep conditioning)
2. Products to maintain results at home
3. Seasonal recommendations
4. Client's past preferences if available

Respond in JSON format:
{
  "addOnServices": [
    {"name": "service name", "reason": "why it complements", "price": 00.00}
  ],
  "products": [
    {"name": "product name", "reason": "why they need it", "price": 00.00}
  ],
  "personalizedMessage": "A friendly message explaining the suggestions"
}`;

    const response = await openRouterChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Please suggest upsells for this booking." },
    ]);

    // Parse JSON response
    let suggestions;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      suggestions = {
        addOnServices: [],
        products: [],
        personalizedMessage: response,
      };
    }

    // Calculate potential revenue
    const addOnRevenue = suggestions.addOnServices?.reduce(
      (sum: number, s: { price: number }) => sum + (s.price || 0),
      0
    ) || 0;
    const productRevenue = suggestions.products?.reduce(
      (sum: number, p: { price: number }) => sum + (p.price || 0),
      0
    ) || 0;

    return NextResponse.json({
      suggestions,
      potentialRevenue: {
        addOnServices: addOnRevenue,
        products: productRevenue,
        total: addOnRevenue + productRevenue,
      },
      currentBookingTotal: services.reduce(
        (sum: number, s: { price: number }) => sum + (s.price || 0),
        0
      ),
    });
  } catch (error) {
    console.error("Error generating upsell suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate upsell suggestions" },
      { status: 500 }
    );
  }
}
