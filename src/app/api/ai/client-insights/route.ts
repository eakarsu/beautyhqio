import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientData } = body;

    if (!clientId && !clientData) {
      return NextResponse.json(
        { error: "clientId or clientData is required" },
        { status: 400 }
      );
    }

    let enrichedClientData: Record<string, unknown>;

    if (clientId) {
      // Real DB-backed enrichment
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          loyaltyAccount: true,
          appointments: {
            orderBy: { scheduledStart: "desc" },
            take: 50,
            include: {
              services: { include: { service: true } },
              staff: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
          transactions: {
            orderBy: { date: "desc" },
            take: 50,
            include: {
              lineItems: {
                include: { service: true, product: true },
              },
            },
          },
          preferences: true,
          reviews: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      // Visit history: derive from completed appointments + transactions
      const visitHistory = client.appointments
        .filter((a) =>
          ["COMPLETED", "CHECKED_IN", "IN_SERVICE"].includes(a.status)
        )
        .slice(0, 20)
        .map((a) => {
          const svcNames = a.services
            .map((s) => s.service.name)
            .join(" + ");
          const staffName =
            a.staff.displayName ||
            `${a.staff.user.firstName} ${a.staff.user.lastName}`;
          // Find matching transaction for amount
          const tx = client.transactions.find(
            (t) => t.appointmentId === a.id
          );
          const amount = tx
            ? Number(tx.totalAmount)
            : a.services.reduce((sum, s) => sum + Number(s.price), 0);
          return {
            date: fmtDate(a.scheduledStart),
            service: svcNames || "Appointment",
            amount,
            staff: staffName,
          };
        });

      const productPurchases = client.transactions
        .flatMap((t) =>
          t.lineItems
            .filter((li) => li.type === "PRODUCT" && li.product)
            .map((li) => ({
              name: li.name,
              date: fmtDate(t.date),
              amount: Number(li.totalPrice),
            }))
        )
        .slice(0, 10);

      // Aggregates
      const completedAppts = client.appointments.filter(
        (a) => a.status === "COMPLETED"
      );
      const noShows = client.appointments.filter(
        (a) => a.status === "NO_SHOW"
      ).length;
      const totalAppts = client.appointments.length;

      const totalSpend = client.transactions.reduce(
        (sum, t) => sum + Number(t.totalAmount),
        0
      );
      const averageVisit = completedAppts.length
        ? Math.round(totalSpend / completedAppts.length)
        : 0;

      // Visit frequency: average days between completed appointments
      const sorted = completedAppts
        .map((a) => a.scheduledStart.getTime())
        .sort((a, b) => a - b);
      let avgGapDays = 0;
      if (sorted.length >= 2) {
        const gaps = [];
        for (let i = 1; i < sorted.length; i++) {
          gaps.push((sorted[i] - sorted[i - 1]) / DAY_MS);
        }
        avgGapDays = Math.round(
          gaps.reduce((a, b) => a + b, 0) / gaps.length
        );
      }
      const visitFrequency =
        avgGapDays > 0
          ? `Every ${Math.max(1, Math.round(avgGapDays / 7))} weeks (~${avgGapDays} days)`
          : completedAppts.length === 1
          ? "First visit completed"
          : "No visit history";

      const lastVisit = completedAppts[0]
        ? fmtDate(completedAppts[0].scheduledStart)
        : "Never";

      const noShowRate = totalAppts
        ? Math.round((noShows / totalAppts) * 100)
        : 0;

      // Rebook rate: completed appointments followed by another booking within 90 days
      let rebookCount = 0;
      const completedSorted = completedAppts.sort(
        (a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime()
      );
      for (let i = 0; i < completedSorted.length - 1; i++) {
        const gap =
          completedSorted[i + 1].scheduledStart.getTime() -
          completedSorted[i].scheduledStart.getTime();
        if (gap < 90 * DAY_MS) rebookCount++;
      }
      const rebookRate = completedSorted.length > 1
        ? Math.round((rebookCount / (completedSorted.length - 1)) * 100)
        : 0;

      // Preferred staff: most-frequent staff
      const staffCounts = new Map<string, number>();
      for (const a of completedAppts) {
        const name =
          a.staff.displayName ||
          `${a.staff.user.firstName} ${a.staff.user.lastName}`;
        staffCounts.set(name, (staffCounts.get(name) || 0) + 1);
      }
      const preferredStaff =
        [...staffCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "No preference yet";

      enrichedClientData = {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        memberSince: fmtDate(client.createdAt),
        loyaltyTier: client.loyaltyAccount?.tier || "Standard",
        loyaltyPoints: client.loyaltyAccount?.pointsBalance || 0,
        status: client.status,
        tags: client.tags,
        visitHistory,
        productPurchases,
        preferences: {
          preferredStaff,
          preferredDay: "—",
          preferredTime: "—",
          communicationPreference: client.preferredContactMethod || "sms",
        },
        metrics: {
          totalSpend,
          averageVisit,
          visitFrequency,
          lastVisit,
          totalAppointments: totalAppts,
          completedAppointments: completedAppts.length,
          noShowRate,
          rebookRate,
        },
        recentReviews: client.reviews.map((r) => ({
          rating: r.rating,
          comment: r.comment,
          date: fmtDate(r.createdAt),
        })),
        ...clientData,
      };
    } else {
      enrichedClientData = clientData;
    }

    const ec = enrichedClientData as Record<string, any>;
    const visitHistoryStr = (ec.visitHistory || [])
      .map(
        (v: { date: string; service: string; amount: number; staff: string }) =>
          `- ${v.date}: ${v.service} ($${v.amount}) with ${v.staff}`
      )
      .join("\n");
    const productsStr = (ec.productPurchases || [])
      .map(
        (p: { name: string; date: string; amount: number }) =>
          `- ${p.name} on ${p.date} ($${p.amount})`
      )
      .join("\n");

    const prompt = `You are an AI client insights specialist for a beauty salon. Analyze the following client data and provide actionable insights.

CLIENT PROFILE:
Name: ${ec.firstName} ${ec.lastName}
Email: ${ec.email || "n/a"}
Member Since: ${ec.memberSince || "Unknown"}
Loyalty Tier: ${ec.loyaltyTier || "Standard"}
Loyalty Points: ${ec.loyaltyPoints || 0}
Status: ${ec.status || "ACTIVE"}

VISIT HISTORY (real):
${visitHistoryStr || "No completed visits"}

PRODUCT PURCHASES (real):
${productsStr || "None"}

PREFERENCES:
- Preferred Staff: ${ec.preferences?.preferredStaff}
- Communication: ${ec.preferences?.communicationPreference}

METRICS:
- Total Spend: $${ec.metrics?.totalSpend}
- Average Visit: $${ec.metrics?.averageVisit}
- Visit Frequency: ${ec.metrics?.visitFrequency}
- Last Visit: ${ec.metrics?.lastVisit}
- No-Show Rate: ${ec.metrics?.noShowRate}%
- Rebook Rate: ${ec.metrics?.rebookRate}%

Provide comprehensive client insights in JSON format:
{
  "summary": "2-3 sentence overview of this client's value and behavior",
  "clientScore": {
    "value": 1-100,
    "label": "VIP/High Value/Regular/At Risk/New",
    "trend": "up/down/stable"
  },
  "behaviorInsights": [
    { "category": "Spending/Frequency/Loyalty/Services", "insight": "specific insight", "impact": "positive/negative/neutral" }
  ],
  "serviceRecommendations": [
    { "service": "Service name", "reason": "Why this would suit them", "confidence": 1-100, "estimatedValue": 50 }
  ],
  "productRecommendations": [
    { "product": "Product name", "reason": "Why they'd like it", "confidence": 1-100 }
  ],
  "retentionStrategies": ["strategy1", "strategy2"],
  "upsellOpportunities": ["opportunity1", "opportunity2"],
  "nextBestAction": { "action": "What to do next", "timing": "When to do it", "expectedOutcome": "What to expect" },
  "churnRisk": { "level": "low/medium/high", "factors": ["factor1"], "preventionTips": ["tip1"] }
}`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content:
            "You are an expert in customer analytics and client relationship management for beauty and wellness businesses. Provide data-driven insights that help increase client lifetime value and satisfaction. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 10000, temperature: 0.6 }
    );

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
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate client insights",
      },
      { status: 500 }
    );
  }
}
