import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symptoms, duration, severity, additionalInfo, sessionId } = body;

    if (!symptoms || symptoms.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one symptom" },
        { status: 400 }
      );
    }

    const prompt = `You are a wellness and beauty health assistant. Analyze these beauty/wellness related symptoms and provide guidance. Do NOT provide medical diagnosis - focus on wellness, skincare, haircare, and lifestyle factors.

Symptoms: ${symptoms.join(", ")}
Duration: ${duration || "Not specified"}
Severity: ${severity || "Not specified"}
Additional Information: ${additionalInfo || "None"}

Provide analysis in this exact JSON format:
{
  "possibleConditions": [
    {
      "condition": "Condition name",
      "probability": 75,
      "description": "Brief description of this wellness concern"
    }
  ],
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3",
    "Specific actionable recommendation 4"
  ],
  "urgencyLevel": "low|medium|high",
  "shouldSeekCare": false,
  "selfCareTips": [
    "Self-care tip 1",
    "Self-care tip 2"
  ],
  "suggestedServices": [
    "Spa or salon service that could help 1",
    "Spa or salon service that could help 2"
  ]
}

Focus on:
- Skin conditions (dryness, acne, sensitivity, aging concerns)
- Hair/scalp issues (dandruff, hair loss, damage)
- Nail health
- Stress-related symptoms
- Posture and tension
- Sleep-related beauty concerns

If symptoms suggest a medical condition, set shouldSeekCare to true and recommend consulting a healthcare professional.`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content: "You are a wellness expert assistant for a beauty and wellness salon. Provide helpful, non-medical guidance focused on beauty, skincare, haircare, and wellness. Always recommend professional medical consultation for serious concerns. Respond only with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.4, maxTokens: 10000 }
    );

    let analysis;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response");
      }
    } catch {
      analysis = {
        possibleConditions: [{ condition: "General Wellness Concern", probability: 50, description: "Further assessment recommended" }],
        recommendations: ["Schedule a consultation with our wellness experts", "Maintain good hydration", "Get adequate rest"],
        urgencyLevel: "low",
        shouldSeekCare: false,
        selfCareTips: ["Stay hydrated", "Practice stress management"],
        suggestedServices: ["Wellness Consultation", "Relaxation Treatment"]
      };
    }

    // Save to database
    const savedCheck = await prisma.symptomCheck.create({
      data: {
        sessionId: sessionId || `session-${Date.now()}`,
        symptoms,
        duration,
        severity,
        additionalInfo,
        possibleConditions: analysis.possibleConditions,
        recommendations: analysis.recommendations,
        urgencyLevel: analysis.urgencyLevel,
        shouldSeekCare: analysis.shouldSeekCare || false,
      },
    });

    return NextResponse.json({
      success: true,
      id: savedCheck.id,
      analysis,
      disclaimer: "This is wellness guidance only, not medical advice. Please consult a healthcare professional for medical concerns.",
    });
  } catch (error) {
    console.error("Symptom checker error:", error);
    return NextResponse.json(
      { error: "Failed to analyze symptoms" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where = sessionId ? { sessionId } : {};

    const checks = await prisma.symptomCheck.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: checks });
  } catch (error) {
    console.error("Error fetching symptom checks:", error);
    return NextResponse.json(
      { error: "Failed to fetch symptom checks" },
      { status: 500 }
    );
  }
}
