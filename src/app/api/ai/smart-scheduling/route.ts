import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, preferredServices, preferredStaff, preferredTime, constraints } = body;

    if (!preferredServices || preferredServices.length === 0) {
      return NextResponse.json(
        { error: "At least one preferred service is required" },
        { status: 400 }
      );
    }

    // Mock schedule data - in production, this would come from database
    const mockScheduleContext = {
      availableSlots: [
        { date: "2024-12-05", time: "9:00 AM", staff: "Sarah J.", duration: 60 },
        { date: "2024-12-05", time: "10:30 AM", staff: "Ashley W.", duration: 60 },
        { date: "2024-12-05", time: "2:00 PM", staff: "Sarah J.", duration: 60 },
        { date: "2024-12-06", time: "9:00 AM", staff: "Michelle T.", duration: 45 },
        { date: "2024-12-06", time: "11:00 AM", staff: "Sarah J.", duration: 60 },
        { date: "2024-12-06", time: "3:30 PM", staff: "David C.", duration: 30 },
        { date: "2024-12-07", time: "10:00 AM", staff: "Emma D.", duration: 90 },
      ],
      peakHours: ["11:00 AM - 2:00 PM", "5:00 PM - 7:00 PM"],
      staffSpecialties: {
        "Sarah J.": ["Color", "Balayage", "Haircuts"],
        "Ashley W.": ["Haircuts", "Blowouts", "Styling"],
        "Michelle T.": ["Nails", "Gel Manicure", "Nail Art"],
        "David C.": ["Men's Haircuts", "Beard Trim"],
        "Emma D.": ["Facials", "Skincare", "Spa Treatments"],
      },
    };

    const prompt = `You are a smart scheduling assistant for a beauty salon. Help optimize appointment scheduling based on the following:

CLIENT REQUEST:
- Client: ${clientName || "New Client"}
- Requested Services: ${preferredServices.join(", ")}
- Preferred Staff: ${preferredStaff || "Any available"}
- Preferred Time: ${preferredTime || "Flexible"}
${constraints ? `- Special Constraints: ${constraints}` : ""}

CURRENT SCHEDULE DATA:
${JSON.stringify(mockScheduleContext, null, 2)}

Please analyze and provide:
1. Top 3 recommended appointment slots with reasoning
2. Staff matching recommendations based on service specialty
3. Tips to optimize the booking (combining services, avoiding peak times, etc.)
4. Alternative suggestions if preferred time is busy

Respond in JSON format:
{
  "recommendedSlots": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM AM/PM",
      "staff": "Staff Name",
      "services": ["service1"],
      "totalDuration": 60,
      "reason": "Why this slot is recommended",
      "confidence": 95
    }
  ],
  "staffRecommendations": [
    {
      "staff": "Staff Name",
      "specialty": "Their specialty",
      "matchScore": 90,
      "reason": "Why they're a good match"
    }
  ],
  "optimizationTips": ["tip1", "tip2"],
  "alternativeOptions": ["option1", "option2"],
  "peakTimeWarning": "Warning message if booking during peak hours, or null"
}`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content: "You are an expert scheduling assistant for beauty and wellness businesses. Optimize appointments for client satisfaction and business efficiency. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 2048, temperature: 0.5 }
    );

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("Smart Scheduling Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate scheduling recommendations",
      },
      { status: 500 }
    );
  }
}
