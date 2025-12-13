import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientData } = body;

    if (!clientData) {
      return NextResponse.json(
        { error: "Client data is required" },
        { status: 400 }
      );
    }

    // Mock enriched client data - in production, this would come from database
    const enrichedClientData = {
      ...clientData,
      visitHistory: [
        { date: "2024-12-02", service: "Balayage", amount: 180, staff: "Sarah J." },
        { date: "2024-11-15", service: "Haircut", amount: 45, staff: "Ashley W." },
        { date: "2024-10-28", service: "Haircut + Blowout", amount: 75, staff: "Ashley W." },
        { date: "2024-10-01", service: "Color + Cut", amount: 165, staff: "Sarah J." },
        { date: "2024-09-10", service: "Haircut", amount: 45, staff: "Sarah J." },
      ],
      productPurchases: [
        { name: "Moroccan Oil Shampoo", date: "2024-11-15", amount: 28 },
        { name: "Olaplex No. 3", date: "2024-10-28", amount: 28 },
      ],
      preferences: {
        preferredStaff: "Sarah J.",
        preferredDay: "Saturday",
        preferredTime: "Morning",
        communicationPreference: "Text",
      },
      metrics: {
        totalSpend: 622,
        averageVisit: 102,
        visitFrequency: "Every 4-6 weeks",
        lastVisit: "2024-12-02",
        noShowRate: 0,
        rebookRate: 85,
      },
    };

    const prompt = `You are an AI client insights specialist for a beauty salon. Analyze the following client data and provide actionable insights.

CLIENT PROFILE:
Name: ${enrichedClientData.firstName} ${enrichedClientData.lastName}
Email: ${enrichedClientData.email}
Member Since: ${enrichedClientData.memberSince || "2024"}
Loyalty Tier: ${enrichedClientData.loyaltyTier || "Standard"}

VISIT HISTORY:
${enrichedClientData.visitHistory.map((v: { date: string; service: string; amount: number; staff: string }) => `- ${v.date}: ${v.service} ($${v.amount}) with ${v.staff}`).join("\n")}

PRODUCT PURCHASES:
${enrichedClientData.productPurchases.map((p: { name: string; date: string; amount: number }) => `- ${p.name} on ${p.date} ($${p.amount})`).join("\n")}

PREFERENCES:
- Preferred Staff: ${enrichedClientData.preferences.preferredStaff}
- Preferred Day: ${enrichedClientData.preferences.preferredDay}
- Preferred Time: ${enrichedClientData.preferences.preferredTime}
- Communication: ${enrichedClientData.preferences.communicationPreference}

METRICS:
- Total Spend: $${enrichedClientData.metrics.totalSpend}
- Average Visit: $${enrichedClientData.metrics.averageVisit}
- Visit Frequency: ${enrichedClientData.metrics.visitFrequency}
- Last Visit: ${enrichedClientData.metrics.lastVisit}
- No-Show Rate: ${enrichedClientData.metrics.noShowRate}%
- Rebook Rate: ${enrichedClientData.metrics.rebookRate}%

Provide comprehensive client insights in JSON format:
{
  "summary": "2-3 sentence overview of this client's value and behavior",
  "clientScore": {
    "value": 1-100,
    "label": "VIP/High Value/Regular/At Risk/New",
    "trend": "up/down/stable"
  },
  "behaviorInsights": [
    {
      "category": "Spending/Frequency/Loyalty/Services",
      "insight": "specific insight",
      "impact": "positive/negative/neutral"
    }
  ],
  "serviceRecommendations": [
    {
      "service": "Service name",
      "reason": "Why this would suit them",
      "confidence": 1-100,
      "estimatedValue": 50
    }
  ],
  "productRecommendations": [
    {
      "product": "Product name",
      "reason": "Why they'd like it",
      "confidence": 1-100
    }
  ],
  "retentionStrategies": ["strategy1", "strategy2"],
  "upsellOpportunities": ["opportunity1", "opportunity2"],
  "nextBestAction": {
    "action": "What to do next",
    "timing": "When to do it",
    "expectedOutcome": "What to expect"
  },
  "churnRisk": {
    "level": "low/medium/high",
    "factors": ["factor1"],
    "preventionTips": ["tip1"]
  }
}`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content: "You are an expert in customer analytics and client relationship management for beauty and wellness businesses. Provide data-driven insights that help increase client lifetime value and satisfaction. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 2048, temperature: 0.6 }
    );

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        success: true,
        data: result,
        clientData: enrichedClientData,
      });
    }

    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("Client Insights Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate client insights",
      },
      { status: 500 }
    );
  }
}
