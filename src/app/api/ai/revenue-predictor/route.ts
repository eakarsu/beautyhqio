import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeframe, includeSeasonality } = body;

    // Mock historical data - in production, this would come from database
    const historicalData = {
      lastMonth: {
        revenue: 45280,
        appointments: 312,
        avgTicket: 145,
        newClients: 34,
        productSales: 8540,
        topServices: ["Balayage", "Haircut", "Gel Manicure"],
      },
      lastQuarter: {
        revenueByMonth: [42150, 44890, 45280],
        growthRate: 3.2,
        clientRetention: 78,
      },
      lastYear: {
        totalRevenue: 498750,
        peakMonths: ["March", "December"],
        slowMonths: ["January", "August"],
      },
      currentBookings: {
        thisWeek: 48,
        nextWeek: 52,
        thisMonth: 185,
        bookedRevenue: 28450,
      },
      staffMetrics: {
        totalStaff: 5,
        avgUtilization: 72,
        topPerformer: "Sarah J.",
      },
    };

    const prompt = `You are a business analytics AI for a beauty salon. Based on the following historical data, predict future revenue and provide growth strategies.

HISTORICAL DATA:
Last Month Performance:
- Revenue: $${historicalData.lastMonth.revenue.toLocaleString()}
- Appointments: ${historicalData.lastMonth.appointments}
- Average Ticket: $${historicalData.lastMonth.avgTicket}
- New Clients: ${historicalData.lastMonth.newClients}
- Product Sales: $${historicalData.lastMonth.productSales.toLocaleString()}
- Top Services: ${historicalData.lastMonth.topServices.join(", ")}

Quarterly Trend:
- Revenue by Month: $${historicalData.lastQuarter.revenueByMonth.map(r => r.toLocaleString()).join(", $")}
- Growth Rate: ${historicalData.lastQuarter.growthRate}%
- Client Retention: ${historicalData.lastQuarter.clientRetention}%

Annual Context:
- Total Revenue Last Year: $${historicalData.lastYear.totalRevenue.toLocaleString()}
- Peak Months: ${historicalData.lastYear.peakMonths.join(", ")}
- Slow Months: ${historicalData.lastYear.slowMonths.join(", ")}

Current Bookings:
- This Week: ${historicalData.currentBookings.thisWeek} appointments
- Next Week: ${historicalData.currentBookings.nextWeek} appointments
- This Month Total: ${historicalData.currentBookings.thisMonth} appointments
- Booked Revenue: $${historicalData.currentBookings.bookedRevenue.toLocaleString()}

Staff Metrics:
- Total Staff: ${historicalData.staffMetrics.totalStaff}
- Average Utilization: ${historicalData.staffMetrics.avgUtilization}%
- Top Performer: ${historicalData.staffMetrics.topPerformer}

Timeframe: ${timeframe || "Next Month"}
${includeSeasonality ? "Include seasonal factors in analysis." : ""}

Provide comprehensive revenue predictions in JSON format:
{
  "prediction": {
    "expectedRevenue": 50000,
    "confidenceInterval": { "low": 45000, "high": 55000 },
    "confidence": 85,
    "comparedToLastMonth": "+10.5%",
    "comparedToLastYear": "+15.2%"
  },
  "breakdown": {
    "servicesRevenue": 38000,
    "productRevenue": 9500,
    "expectedAppointments": 340,
    "expectedNewClients": 38
  },
  "monthlyForecast": [
    { "month": "January", "revenue": 42000, "trend": "down" },
    { "month": "February", "revenue": 45000, "trend": "up" },
    { "month": "March", "revenue": 52000, "trend": "up" }
  ],
  "growthDrivers": [
    {
      "factor": "Factor name",
      "impact": "+$5000",
      "confidence": 80,
      "actionable": true
    }
  ],
  "risks": [
    {
      "factor": "Risk factor",
      "potentialImpact": "-$3000",
      "probability": 30,
      "mitigation": "How to mitigate"
    }
  ],
  "opportunities": [
    {
      "opportunity": "Description",
      "potentialValue": 5000,
      "effort": "low/medium/high",
      "timeframe": "immediate/short-term/long-term"
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "action": "Specific action",
      "expectedImpact": "+$3000",
      "implementation": "How to implement"
    }
  ],
  "kpiTargets": {
    "revenueTarget": 48000,
    "appointmentTarget": 330,
    "avgTicketTarget": 150,
    "newClientTarget": 40
  }
}`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content: "You are an expert business analyst specializing in beauty and wellness industry. Provide accurate predictions based on historical trends and industry knowledge. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 2500, temperature: 0.5 }
    );

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        success: true,
        data: result,
        historicalData,
      });
    }

    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("Revenue Predictor Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate revenue prediction",
      },
      { status: 500 }
    );
  }
}
