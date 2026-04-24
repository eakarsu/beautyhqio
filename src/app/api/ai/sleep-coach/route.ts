import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bedtime,
      wakeTime,
      sleepQuality,
      caffeineIntake,
      screenTime,
      exercise,
      stress,
      roomTemp,
      noiseLevel,
      lightLevel,
      additionalNotes,
    } = body;

    // Calculate sleep duration
    let sleepDuration = 0;
    if (bedtime && wakeTime) {
      const bed = new Date(`2024-01-01 ${bedtime}`);
      const wake = new Date(`2024-01-01 ${wakeTime}`);
      if (wake < bed) {
        wake.setDate(wake.getDate() + 1);
      }
      sleepDuration = (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);
    }

    const prompt = `You are a certified sleep coach specializing in beauty sleep and wellness. Analyze this sleep data and provide personalized coaching.

Sleep Data:
- Bedtime: ${bedtime || "Not provided"}
- Wake Time: ${wakeTime || "Not provided"}
- Sleep Duration: ${sleepDuration.toFixed(1)} hours
- Sleep Quality (1-10): ${sleepQuality || "Not provided"}
- Caffeine Intake: ${caffeineIntake ? "Yes" : "No"}
- Screen Time Before Bed: ${screenTime ? `${screenTime} minutes` : "Not provided"}
- Exercise Today: ${exercise ? "Yes" : "No"}
- Stress Level (1-10): ${stress || "Not provided"}
- Room Temperature: ${roomTemp || "Not provided"}
- Noise Level: ${noiseLevel || "Not provided"}
- Light Level: ${lightLevel || "Not provided"}
- Additional Notes: ${additionalNotes || "None"}

Analyze this data and provide coaching in this exact JSON format:
{
  "sleepScore": 75,
  "analysis": {
    "duration": {
      "status": "optimal|insufficient|excessive",
      "message": "Analysis of sleep duration"
    },
    "quality": {
      "status": "good|fair|poor",
      "message": "Analysis of sleep quality factors"
    },
    "environment": {
      "status": "ideal|needs_improvement",
      "message": "Analysis of sleep environment"
    },
    "habits": {
      "status": "healthy|needs_work",
      "message": "Analysis of pre-sleep habits"
    }
  },
  "insights": [
    {
      "type": "positive|concern|tip",
      "icon": "moon|sun|coffee|phone|bed|star",
      "title": "Insight title",
      "message": "Detailed insight message"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "timing|environment|habits|relaxation",
      "action": "Specific action to take",
      "benefit": "How this helps sleep and beauty",
      "implementation": "How to implement this"
    }
  ],
  "beautyConnection": {
    "skinImpact": "How sleep affects skin health",
    "hairImpact": "How sleep affects hair health",
    "overallWellness": "General wellness connection"
  },
  "suggestedServices": [
    {
      "service": "Spa service name",
      "reason": "Why this helps with sleep"
    }
  ],
  "bedtimeRoutine": [
    {
      "time": "-2 hours",
      "activity": "Activity recommendation"
    },
    {
      "time": "-1 hour",
      "activity": "Activity recommendation"
    },
    {
      "time": "-30 min",
      "activity": "Activity recommendation"
    },
    {
      "time": "Bedtime",
      "activity": "Final preparation"
    }
  ]
}

Focus on actionable advice that connects sleep quality to beauty and wellness outcomes.`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content: "You are a certified sleep coach with expertise in beauty sleep and wellness. Provide science-based sleep advice that connects to skin health, hair health, and overall beauty outcomes. Respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.5, maxTokens: 10000 }
    );

    let coaching;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        coaching = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response");
      }
    } catch {
      coaching = {
        sleepScore: 50,
        analysis: {
          duration: { status: "needs_review", message: "Unable to fully analyze - please provide more data" },
          quality: { status: "fair", message: "Quality assessment requires more information" },
          environment: { status: "needs_improvement", message: "Review your sleep environment" },
          habits: { status: "needs_work", message: "Consider improving pre-sleep habits" }
        },
        insights: [{ type: "tip", icon: "moon", title: "Track More Data", message: "Continue logging for better insights" }],
        recommendations: [{ priority: "high", category: "habits", action: "Maintain consistent sleep schedule", benefit: "Improves circadian rhythm", implementation: "Set fixed bedtime and wake time" }],
        beautyConnection: {
          skinImpact: "Sleep is essential for skin cell regeneration",
          hairImpact: "Hair growth occurs during deep sleep phases",
          overallWellness: "Quality sleep enhances natural beauty"
        },
        suggestedServices: [{ service: "Relaxation Massage", reason: "Promotes better sleep" }],
        bedtimeRoutine: [
          { time: "-1 hour", activity: "Dim lights and relax" },
          { time: "Bedtime", activity: "Lights out, comfortable position" }
        ]
      };
    }

    // Save to database
    const savedRecord = await prisma.sleepRecord.create({
      data: {
        bedtime,
        wakeTime,
        sleepDuration,
        sleepQuality,
        caffeineIntake: caffeineIntake || false,
        screenTime,
        exercise: exercise || false,
        stress,
        roomTemp,
        noiseLevel,
        lightLevel,
        insights: coaching.insights,
        recommendations: coaching.recommendations,
        sleepScore: coaching.sleepScore,
      },
    });

    return NextResponse.json({
      success: true,
      id: savedRecord.id,
      coaching,
    });
  } catch (error) {
    console.error("Sleep coach error:", error);
    return NextResponse.json(
      { error: "Failed to analyze sleep data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const limit = parseInt(searchParams.get("limit") || "30");

    const where = clientId ? { clientId } : {};

    const records = await prisma.sleepRecord.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
    });

    // Calculate trends
    const avgScore = records.length > 0
      ? records.reduce((sum, r) => sum + (r.sleepScore || 0), 0) / records.length
      : 0;

    const avgDuration = records.length > 0
      ? records.reduce((sum, r) => sum + Number(r.sleepDuration || 0), 0) / records.length
      : 0;

    return NextResponse.json({
      success: true,
      data: records,
      trends: {
        averageScore: Math.round(avgScore),
        averageDuration: avgDuration.toFixed(1),
        totalRecords: records.length,
      },
    });
  } catch (error) {
    console.error("Error fetching sleep records:", error);
    return NextResponse.json(
      { error: "Failed to fetch sleep records" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.sleepRecord.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting sleep record:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
