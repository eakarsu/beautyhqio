import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skinType, concerns, age, lifestyle, currentRoutine } = body;

    if (!skinType || !concerns || concerns.length === 0) {
      return NextResponse.json(
        { error: "Please provide skin type and at least one concern" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert skincare consultant and esthetician. Analyze the following skin profile and provide comprehensive recommendations.

Client Profile:
- Skin Type: ${skinType}
- Concerns: ${concerns.join(", ")}
- Age: ${age || "Not specified"}
- Lifestyle: ${lifestyle || "Not specified"}
- Current Routine: ${currentRoutine ? JSON.stringify(currentRoutine) : "Not specified"}

Provide a detailed skin analysis in this exact JSON format:
{
  "skinCondition": {
    "hydration": 65,
    "oiliness": 40,
    "sensitivity": 30,
    "overallHealth": 70,
    "summary": "Brief summary of skin condition"
  },
  "recommendations": {
    "ingredients": [
      {
        "name": "Ingredient name",
        "benefit": "What it does for this skin",
        "howToUse": "How to incorporate it"
      }
    ],
    "avoid": ["ingredient to avoid 1", "ingredient to avoid 2"]
  },
  "productSuggestions": [
    {
      "step": "Cleanser",
      "type": "Gel Cleanser",
      "keyIngredients": ["ingredient1", "ingredient2"],
      "benefit": "Why this helps"
    },
    {
      "step": "Toner",
      "type": "Hydrating Toner",
      "keyIngredients": ["ingredient1", "ingredient2"],
      "benefit": "Why this helps"
    },
    {
      "step": "Serum",
      "type": "Vitamin C Serum",
      "keyIngredients": ["ingredient1", "ingredient2"],
      "benefit": "Why this helps"
    },
    {
      "step": "Moisturizer",
      "type": "Lightweight Moisturizer",
      "keyIngredients": ["ingredient1", "ingredient2"],
      "benefit": "Why this helps"
    },
    {
      "step": "SPF",
      "type": "Broad Spectrum SPF 50",
      "keyIngredients": ["ingredient1", "ingredient2"],
      "benefit": "Why this helps"
    }
  ],
  "routineAdvice": {
    "morning": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
    "evening": ["Step 1", "Step 2", "Step 3", "Step 4"],
    "weekly": ["Weekly treatment 1", "Weekly treatment 2"]
  },
  "treatmentSuggestions": [
    {
      "treatment": "Professional Treatment Name",
      "frequency": "How often",
      "benefit": "What it addresses",
      "idealFor": "Best for which concerns"
    }
  ],
  "lifestyleTips": [
    "Lifestyle tip 1",
    "Lifestyle tip 2",
    "Lifestyle tip 3"
  ],
  "expectedTimeline": {
    "week1_2": "What to expect in weeks 1-2",
    "month1": "What to expect after 1 month",
    "month3": "What to expect after 3 months"
  }
}

Be specific and personalized based on the skin type and concerns provided.`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content: "You are a licensed esthetician and skincare expert. Provide detailed, science-based skincare recommendations. Be specific about ingredients and routines. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.5, maxTokens: 10000 }
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
        skinCondition: {
          hydration: 50,
          oiliness: 50,
          sensitivity: 50,
          overallHealth: 50,
          summary: "Please schedule a consultation for a detailed analysis"
        },
        recommendations: {
          ingredients: [{ name: "Hyaluronic Acid", benefit: "Hydration", howToUse: "Apply to damp skin" }],
          avoid: ["Harsh sulfates", "High concentration actives without guidance"]
        },
        productSuggestions: [],
        routineAdvice: {
          morning: ["Cleanse", "Moisturize", "SPF"],
          evening: ["Cleanse", "Moisturize"],
          weekly: ["Gentle exfoliation"]
        },
        treatmentSuggestions: [{ treatment: "Consultation Facial", frequency: "Once", benefit: "Personalized assessment", idealFor: "All skin types" }],
        lifestyleTips: ["Stay hydrated", "Get enough sleep", "Wear SPF daily"],
        expectedTimeline: {
          week1_2: "Initial adjustment period",
          month1: "Noticeable improvement",
          month3: "Significant results"
        }
      };
    }

    // Save to database
    const savedAnalysis = await prisma.skinAnalysis.create({
      data: {
        skinType,
        concerns,
        age,
        lifestyle,
        currentRoutine: currentRoutine || {},
        skinCondition: analysis.skinCondition,
        recommendations: analysis.recommendations,
        productSuggestions: analysis.productSuggestions,
        routineAdvice: analysis.routineAdvice,
        treatmentSuggestions: analysis.treatmentSuggestions,
      },
    });

    return NextResponse.json({
      success: true,
      id: savedAnalysis.id,
      analysis,
    });
  } catch (error) {
    console.error("Skin analyzer error:", error);
    return NextResponse.json(
      { error: "Failed to analyze skin" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (id) {
      const analysis = await prisma.skinAnalysis.findUnique({
        where: { id },
      });
      return NextResponse.json({ success: true, data: analysis });
    }

    const analyses = await prisma.skinAnalysis.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: analyses });
  } catch (error) {
    console.error("Error fetching skin analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch skin analyses" },
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

    await prisma.skinAnalysis.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting skin analysis:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
