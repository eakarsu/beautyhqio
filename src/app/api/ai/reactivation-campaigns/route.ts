import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

// POST /api/ai/reactivation-campaigns - Generate AI-powered client reactivation campaigns
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inactiveDays = 60, limit = 50 } = body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    // Find inactive clients
    const inactiveClients = await prisma.client.findMany({
      where: {
        status: "ACTIVE",
        appointments: {
          none: {
            scheduledStart: { gte: cutoffDate },
          },
        },
      },
      include: {
        appointments: {
          where: { status: "COMPLETED" },
          orderBy: { scheduledStart: "desc" },
          take: 5,
          include: {
            services: {
              include: {
                service: { select: { name: true, price: true } },
              },
            },
            staff: {
              select: { displayName: true },
            },
          },
        },
        transactions: {
          orderBy: { date: "desc" },
          take: 3,
          select: {
            totalAmount: true,
            date: true,
          },
        },
        loyaltyAccount: {
          select: {
            pointsBalance: true,
            tier: true,
          },
        },
      },
      take: limit,
    });

    // Analyze each client
    const clientProfiles = inactiveClients.map((client) => {
      const lastVisit = client.appointments[0]?.scheduledStart;
      const daysSinceVisit = lastVisit
        ? Math.floor(
            (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      const favoriteServices = client.appointments
        .flatMap((a) => a.services.map((s) => s.service.name));

      const avgSpend =
        client.transactions.length > 0
          ? client.transactions.reduce(
              (sum, t) => sum + Number(t.totalAmount),
              0
            ) / client.transactions.length
          : 0;

      return {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        phone: client.phone,
        daysSinceVisit,
        lastVisitDate: lastVisit,
        visitCount: client.appointments.length,
        favoriteServices: [...new Set(favoriteServices)].slice(0, 3),
        preferredStaff: client.appointments[0]?.staff?.displayName || null,
        avgSpend: Math.round(avgSpend),
        loyaltyTier: client.loyaltyAccount?.tier || null,
        loyaltyPoints: client.loyaltyAccount?.pointsBalance || 0,
        allowEmail: client.allowEmail,
        allowSms: client.allowSms,
      };
    });

    // Get available services for offers
    const services = await prisma.service.findMany({
      where: { isActive: true, allowOnline: true },
      select: { name: true, price: true },
      take: 20,
    });

    // Generate AI campaign suggestions
    const systemPrompt = `You are a marketing expert for a beauty & wellness salon. Create personalized reactivation campaigns for inactive clients.

INACTIVE CLIENTS SUMMARY:
- Total inactive clients: ${clientProfiles.length}
- Average days since last visit: ${Math.round(
      clientProfiles.reduce((sum, c) => sum + (c.daysSinceVisit || 0), 0) /
        clientProfiles.length
    )}
- Clients with loyalty points: ${clientProfiles.filter((c) => c.loyaltyPoints > 0).length}

CLIENT SEGMENTS:
1. VIP (high spenders): ${clientProfiles.filter((c) => c.avgSpend > 150).length} clients
2. Regular: ${clientProfiles.filter((c) => c.avgSpend >= 50 && c.avgSpend <= 150).length} clients
3. Occasional: ${clientProfiles.filter((c) => c.avgSpend < 50).length} clients

SAMPLE CLIENT PROFILES:
${clientProfiles
  .slice(0, 5)
  .map(
    (c) => `- ${c.name}: ${c.daysSinceVisit} days inactive, ${c.visitCount} total visits
  Favorite services: ${c.favoriteServices.join(", ") || "Various"}
  Avg spend: $${c.avgSpend}, Loyalty points: ${c.loyaltyPoints}`
  )
  .join("\n")}

AVAILABLE SERVICES FOR OFFERS:
${services.map((s) => `- ${s.name}: $${Number(s.price)}`).join("\n")}

INSTRUCTIONS:
Create 3 different campaign types:
1. Email campaign for all inactive clients
2. SMS campaign for urgency (short, impactful)
3. VIP win-back campaign with premium offer

Include specific offers, subject lines, and message content.

Respond in JSON format:
{
  "campaigns": [
    {
      "type": "email",
      "name": "Campaign name",
      "subject": "Email subject line",
      "previewText": "Preview text for email",
      "message": "Full message content with {firstName} personalization",
      "offer": "Specific offer details",
      "offerValue": "$X or X%",
      "targetSegment": "all|vip|regular|occasional",
      "urgency": "low|medium|high",
      "bestSendTime": "recommended send time"
    }
  ],
  "personalizedOffers": [
    {
      "clientId": "id",
      "clientName": "name",
      "suggestedOffer": "personalized offer",
      "reason": "why this offer"
    }
  ],
  "projectedReactivation": "XX%",
  "tips": ["tip 1", "tip 2"]
}`;

    const response = await openRouterChat([
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          "Please create reactivation campaigns for our inactive clients.",
      },
    ]);

    // Parse AI response
    let campaignData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        campaignData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      campaignData = {
        campaigns: [
          {
            type: "email",
            name: "We Miss You",
            subject: "We haven't seen you in a while!",
            message:
              "Hi {firstName}, it's been a while since your last visit. Come back and enjoy 20% off your next service!",
            offer: "20% off next service",
            targetSegment: "all",
          },
        ],
        tips: [response],
      };
    }

    // Match personalized offers to actual clients
    if (campaignData.personalizedOffers) {
      campaignData.personalizedOffers = campaignData.personalizedOffers.map(
        (offer: { clientId: string }) => {
          const client = clientProfiles.find((c) => c.id === offer.clientId);
          return { ...offer, client };
        }
      );
    }

    return NextResponse.json({
      summary: {
        totalInactiveClients: clientProfiles.length,
        inactiveDaysThreshold: inactiveDays,
        bySegment: {
          vip: clientProfiles.filter((c) => c.avgSpend > 150).length,
          regular: clientProfiles.filter(
            (c) => c.avgSpend >= 50 && c.avgSpend <= 150
          ).length,
          occasional: clientProfiles.filter((c) => c.avgSpend < 50).length,
        },
        contactable: {
          email: clientProfiles.filter((c) => c.email && c.allowEmail).length,
          sms: clientProfiles.filter((c) => c.phone && c.allowSms).length,
        },
      },
      ...campaignData,
      clients: clientProfiles,
    });
  } catch (error) {
    console.error("Error generating reactivation campaigns:", error);
    return NextResponse.json(
      { error: "Failed to generate reactivation campaigns" },
      { status: 500 }
    );
  }
}
