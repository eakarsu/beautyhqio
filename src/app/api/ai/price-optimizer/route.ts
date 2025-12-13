import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

// POST /api/ai/price-optimizer - AI-powered dynamic pricing suggestions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, strategy = "demand" } = body;

    // Get service details
    const service = serviceId
      ? await prisma.service.findUnique({
          where: { id: serviceId },
          include: { category: true },
        })
      : null;

    // Get historical booking data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const whereClause: Record<string, unknown> = {
      createdAt: { gte: thirtyDaysAgo },
      status: { in: ["COMPLETED", "CONFIRMED"] },
    };

    if (serviceId) {
      whereClause.serviceId = serviceId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    // Analyze booking patterns by day of week and time
    const patterns: Record<string, { bookings: number; revenue: number }> = {};
    const hourlyPatterns: Record<number, number> = {};

    appointments.forEach((apt) => {
      const dayOfWeek = new Date(apt.scheduledStart).toLocaleDateString("en-US", {
        weekday: "long",
      });
      const hour = new Date(apt.scheduledStart).getHours();
      const firstService = apt.services[0]?.service;

      if (!patterns[dayOfWeek]) {
        patterns[dayOfWeek] = { bookings: 0, revenue: 0 };
      }
      patterns[dayOfWeek].bookings++;
      patterns[dayOfWeek].revenue += Number(firstService?.price || 0);

      hourlyPatterns[hour] = (hourlyPatterns[hour] || 0) + 1;
    });

    // Get all services for comparison
    const allServices = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            appointmentServices: true,
          },
        },
      },
    });

    const serviceAnalysis = allServices.map((s) => ({
      name: s.name,
      price: Number(s.price),
      bookings: s._count.appointmentServices,
      revenue: Number(s.price) * s._count.appointmentServices,
    }));

    // Build prompt based on strategy
    let strategyPrompt = "";
    switch (strategy) {
      case "demand":
        strategyPrompt =
          "Focus on demand-based pricing: higher prices during peak times, discounts during slow periods";
        break;
      case "competitive":
        strategyPrompt =
          "Focus on competitive positioning: ensure prices are attractive while maintaining profitability";
        break;
      case "value":
        strategyPrompt =
          "Focus on value-based pricing: price based on perceived value and service quality";
        break;
      case "maximize":
        strategyPrompt =
          "Focus on revenue maximization: find the optimal price point for each service";
        break;
      default:
        strategyPrompt = "Provide balanced pricing recommendations";
    }

    const prompt = `Analyze this salon pricing data and provide optimization recommendations.

Strategy: ${strategyPrompt}

${service ? `Target Service: ${service.name} - Current Price: $${service.price}` : "Analyzing all services"}

Booking Patterns by Day:
${JSON.stringify(patterns, null, 2)}

Hourly Booking Distribution:
${JSON.stringify(hourlyPatterns, null, 2)}

Service Performance (Last 30 days):
${JSON.stringify(serviceAnalysis, null, 2)}

Provide recommendations as JSON:
{
  "recommendations": [
    {
      "service": "service name",
      "currentPrice": number,
      "suggestedPrice": number,
      "changePercent": number,
      "reason": "explanation"
    }
  ],
  "dynamicPricing": {
    "peakHours": {"hours": [9, 10, 11], "surcharge": 10},
    "offPeakHours": {"hours": [14, 15, 16], "discount": 15},
    "peakDays": {"days": ["Saturday"], "surcharge": 15},
    "slowDays": {"days": ["Tuesday"], "discount": 20}
  },
  "promotions": [
    {"type": "bundle|time-based|loyalty", "description": "...", "expectedImpact": "..."}
  ],
  "insights": {
    "underpriced": ["service names"],
    "overpriced": ["service names"],
    "opportunities": ["descriptions"]
  }
}`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content:
            "You are an AI pricing strategist for a beauty salon. Analyze data and provide actionable pricing recommendations. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 1500, temperature: 0.3 }
    );

    let analysis;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response };
    } catch {
      analysis = { raw: response };
    }

    return NextResponse.json({
      strategy,
      periodAnalyzed: "Last 30 days",
      totalBookings: appointments.length,
      totalRevenue: appointments.reduce(
        (sum, a) => sum + Number(a.services[0]?.service?.price || 0),
        0
      ),
      analysis,
    });
  } catch (error) {
    console.error("Error in price optimizer:", error);
    return NextResponse.json(
      { error: "Failed to optimize pricing" },
      { status: 500 }
    );
  }
}

// GET /api/ai/price-optimizer - Get current pricing analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category");

    const whereClause: Record<string, unknown> = { isActive: true };
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        category: true,
        _count: {
          select: { appointmentServices: true },
        },
      },
    });

    // Calculate metrics
    const analysis = services.map((service) => {
      const revenuePerService =
        Number(service.price) * service._count.appointmentServices;
      const pricePerMinute = Number(service.price) / service.duration;

      return {
        id: service.id,
        name: service.name,
        category: service.category?.name,
        price: Number(service.price),
        duration: service.duration,
        bookings: service._count.appointmentServices,
        revenue: revenuePerService,
        pricePerMinute: pricePerMinute.toFixed(2),
      };
    });

    // Sort by various metrics
    const byRevenue = [...analysis].sort((a, b) => b.revenue - a.revenue);
    const byBookings = [...analysis].sort((a, b) => b.bookings - a.bookings);
    const byPricePerMinute = [...analysis].sort(
      (a, b) => parseFloat(b.pricePerMinute) - parseFloat(a.pricePerMinute)
    );

    return NextResponse.json({
      services: analysis,
      rankings: {
        topByRevenue: byRevenue.slice(0, 5).map((s) => s.name),
        topByBookings: byBookings.slice(0, 5).map((s) => s.name),
        mostProfitablePerMinute: byPricePerMinute.slice(0, 5).map((s) => s.name),
      },
      averages: {
        price: (
          analysis.reduce((sum, s) => sum + s.price, 0) / analysis.length
        ).toFixed(2),
        duration: Math.round(
          analysis.reduce((sum, s) => sum + s.duration, 0) / analysis.length
        ),
        pricePerMinute: (
          analysis.reduce((sum, s) => sum + parseFloat(s.pricePerMinute), 0) /
          analysis.length
        ).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error getting pricing analysis:", error);
    return NextResponse.json(
      { error: "Failed to get pricing analysis" },
      { status: 500 }
    );
  }
}
