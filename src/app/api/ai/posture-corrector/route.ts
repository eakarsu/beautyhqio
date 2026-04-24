import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      occupation,
      hoursSeated,
      painAreas,
      currentIssues,
      activityLevel,
      additionalInfo,
    } = body;

    if (!occupation) {
      return NextResponse.json(
        { error: "Please provide your occupation" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert posture specialist and wellness consultant. Analyze this posture profile and provide comprehensive recommendations.

Client Profile:
- Occupation: ${occupation}
- Hours Seated Daily: ${hoursSeated || "Not specified"}
- Pain Areas: ${painAreas?.join(", ") || "None specified"}
- Current Issues: ${currentIssues?.join(", ") || "None specified"}
- Activity Level: ${activityLevel || "Not specified"}
- Additional Information: ${additionalInfo || "None"}

Provide a detailed posture assessment in this exact JSON format:
{
  "postureScore": 65,
  "assessment": {
    "overallStatus": "needs_improvement|fair|good|excellent",
    "summary": "Brief overall assessment",
    "riskFactors": ["Risk factor 1", "Risk factor 2"]
  },
  "issues": [
    {
      "area": "Body area (e.g., Neck, Shoulders, Lower Back)",
      "severity": "mild|moderate|severe",
      "description": "Description of the issue",
      "cause": "Likely cause based on occupation/habits",
      "icon": "neck|shoulder|back|hip|leg|general"
    }
  ],
  "exercises": [
    {
      "name": "Exercise name",
      "targetArea": "What it targets",
      "instructions": "Step by step instructions",
      "duration": "How long to hold/reps",
      "frequency": "How often to do it",
      "difficulty": "beginner|intermediate|advanced",
      "videoSearchTerm": "What to search on YouTube for demo"
    }
  ],
  "stretches": [
    {
      "name": "Stretch name",
      "targetArea": "What muscles it stretches",
      "instructions": "How to perform",
      "hold": "How long to hold",
      "frequency": "How often"
    }
  ],
  "ergonomicTips": [
    {
      "category": "desk|chair|monitor|keyboard|general",
      "tip": "Specific ergonomic tip",
      "implementation": "How to implement"
    }
  ],
  "dailyRoutine": {
    "morning": ["Morning recommendation 1", "Morning recommendation 2"],
    "workday": ["During work recommendation 1", "During work recommendation 2"],
    "evening": ["Evening recommendation 1", "Evening recommendation 2"]
  },
  "improvementPlan": {
    "week1": "Focus for week 1",
    "week2": "Focus for week 2",
    "week3": "Focus for week 3",
    "week4": "Focus for week 4",
    "ongoing": "Long-term maintenance"
  },
  "beautyWellnessConnection": {
    "skinEffect": "How posture affects appearance",
    "confidenceBoost": "Confidence and presence impact",
    "energyLevels": "Energy and vitality connection"
  },
  "suggestedServices": [
    {
      "service": "Spa/wellness service name",
      "benefit": "How it helps with posture issues",
      "frequency": "Recommended frequency"
    }
  ],
  "warningSign": {
    "needsProfessional": false,
    "message": "If applicable, when to see a professional"
  }
}

Tailor recommendations specifically to the occupation and identified issues.`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content: "You are a certified posture specialist and ergonomics expert. Provide practical, occupation-specific posture advice. Connect posture to overall wellness and beauty outcomes. Respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.5, maxTokens: 10000 }
    );

    let assessment;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        assessment = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response");
      }
    } catch {
      assessment = {
        postureScore: 50,
        assessment: {
          overallStatus: "needs_improvement",
          summary: "Assessment requires more detailed evaluation",
          riskFactors: ["Prolonged sitting", "Screen-based work"]
        },
        issues: [{ area: "General", severity: "moderate", description: "General posture review recommended", cause: "Occupational factors", icon: "general" }],
        exercises: [{ name: "Chin Tucks", targetArea: "Neck", instructions: "Pull chin back while keeping eyes level", duration: "10 reps", frequency: "Every hour", difficulty: "beginner", videoSearchTerm: "chin tucks exercise" }],
        stretches: [{ name: "Chest Doorway Stretch", targetArea: "Chest and shoulders", instructions: "Place arms on doorframe, lean forward", hold: "30 seconds", frequency: "3x daily" }],
        ergonomicTips: [{ category: "general", tip: "Take breaks every 30 minutes", implementation: "Set timer reminder" }],
        dailyRoutine: { morning: ["Morning stretch routine"], workday: ["Regular breaks"], evening: ["Evening stretches"] },
        improvementPlan: { week1: "Awareness", week2: "Basic exercises", week3: "Consistency", week4: "Progress review", ongoing: "Maintenance" },
        beautyWellnessConnection: { skinEffect: "Good posture improves circulation", confidenceBoost: "Upright posture projects confidence", energyLevels: "Better posture means better breathing" },
        suggestedServices: [{ service: "Therapeutic Massage", benefit: "Releases muscle tension", frequency: "Weekly" }],
        warningSign: { needsProfessional: false, message: "Consult a professional if pain persists" }
      };
    }

    // Save to database
    const savedAssessment = await prisma.postureAssessment.create({
      data: {
        occupation,
        hoursSeated,
        painAreas: painAreas || [],
        currentIssues: currentIssues || [],
        activityLevel,
        postureScore: assessment.postureScore,
        issues: assessment.issues,
        exercises: assessment.exercises,
        ergonomicTips: assessment.ergonomicTips,
        improvementPlan: assessment.improvementPlan,
      },
    });

    return NextResponse.json({
      success: true,
      id: savedAssessment.id,
      assessment,
    });
  } catch (error) {
    console.error("Posture corrector error:", error);
    return NextResponse.json(
      { error: "Failed to analyze posture" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const clientId = searchParams.get("clientId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (id) {
      const assessment = await prisma.postureAssessment.findUnique({
        where: { id },
      });
      return NextResponse.json({ success: true, data: assessment });
    }

    const where = clientId ? { clientId } : {};

    const assessments = await prisma.postureAssessment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: assessments });
  } catch (error) {
    console.error("Error fetching posture assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
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

    await prisma.postureAssessment.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting posture assessment:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
