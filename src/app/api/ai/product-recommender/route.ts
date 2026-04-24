import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      skinType,
      hairType,
      concerns,
      allergies,
      budget,
      preferences,
    } = body;

    if (!concerns || concerns.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one concern" },
        { status: 400 }
      );
    }

    const prompt = `You are a professional beauty consultant and product expert. Create personalized product recommendations based on this client profile.

Client Profile:
- Skin Type: ${skinType || "Not specified"}
- Hair Type: ${hairType || "Not specified"}
- Concerns: ${concerns.join(", ")}
- Allergies/Sensitivities: ${allergies?.join(", ") || "None"}
- Budget: ${budget || "Mid-range"}
- Preferences: ${preferences ? JSON.stringify(preferences) : "None specified"}

Provide comprehensive product recommendations in this exact JSON format:
{
  "clientProfile": {
    "summary": "Brief summary of client's needs",
    "primaryFocus": "Main area to address",
    "challengeLevel": "easy|moderate|complex"
  },
  "skincare": {
    "essentials": [
      {
        "step": "Product step (e.g., Cleanser)",
        "productType": "Specific type (e.g., Gel Cleanser)",
        "keyIngredients": ["Ingredient 1", "Ingredient 2"],
        "benefit": "Why this product type",
        "priceRange": "$-$$-$$$",
        "applicationTip": "How to apply"
      }
    ],
    "treatments": [
      {
        "type": "Treatment type (e.g., Serum, Mask)",
        "focus": "What it targets",
        "keyIngredients": ["Ingredient 1"],
        "frequency": "How often to use",
        "priceRange": "$-$$-$$$"
      }
    ]
  },
  "haircare": {
    "essentials": [
      {
        "step": "Product step",
        "productType": "Specific type",
        "keyIngredients": ["Ingredient 1"],
        "benefit": "Why this helps",
        "priceRange": "$-$$-$$$"
      }
    ],
    "treatments": [
      {
        "type": "Treatment type",
        "focus": "What it addresses",
        "frequency": "How often",
        "priceRange": "$-$$-$$$"
      }
    ]
  },
  "routines": {
    "morning": {
      "steps": ["Step 1 with product type", "Step 2 with product type"],
      "totalTime": "Estimated time"
    },
    "evening": {
      "steps": ["Step 1 with product type", "Step 2 with product type"],
      "totalTime": "Estimated time"
    },
    "weekly": {
      "treatments": ["Weekly treatment 1", "Weekly treatment 2"],
      "bestDay": "Recommended day/time"
    }
  },
  "ingredientsToAvoid": [
    {
      "ingredient": "Ingredient name",
      "reason": "Why to avoid for this client"
    }
  ],
  "ingredientsToSeek": [
    {
      "ingredient": "Ingredient name",
      "benefit": "Why beneficial for this client"
    }
  ],
  "budgetOptions": {
    "drugstore": [
      {
        "category": "Product category",
        "suggestion": "Budget-friendly option"
      }
    ],
    "midRange": [
      {
        "category": "Product category",
        "suggestion": "Mid-range option"
      }
    ],
    "luxury": [
      {
        "category": "Product category",
        "suggestion": "Luxury option"
      }
    ]
  },
  "professionalTreatments": [
    {
      "treatment": "Professional treatment name",
      "benefit": "How it helps",
      "frequency": "Recommended frequency",
      "complementsHomecare": "How it enhances home routine"
    }
  ],
  "expectedResults": {
    "week1": "What to expect week 1",
    "month1": "What to expect after 1 month",
    "month3": "What to expect after 3 months"
  },
  "tips": [
    {
      "category": "application|lifestyle|timing|combination",
      "tip": "Helpful tip"
    }
  ]
}

Be specific about product types and ingredients based on the client's unique profile.`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content: "You are a licensed esthetician and beauty product expert. Provide personalized, science-based product recommendations. Consider allergies and sensitivities carefully. Respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.6, maxTokens: 10000 }
    );

    let recommendations;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response");
      }
    } catch {
      recommendations = {
        clientProfile: { summary: "Personalized analysis in progress", primaryFocus: "General wellness", challengeLevel: "moderate" },
        skincare: { essentials: [], treatments: [] },
        haircare: { essentials: [], treatments: [] },
        routines: { morning: { steps: ["Cleanse", "Moisturize", "SPF"], totalTime: "5 minutes" }, evening: { steps: ["Cleanse", "Moisturize"], totalTime: "5 minutes" }, weekly: { treatments: ["Mask"], bestDay: "Sunday" } },
        ingredientsToAvoid: [],
        ingredientsToSeek: [],
        budgetOptions: { drugstore: [], midRange: [], luxury: [] },
        professionalTreatments: [{ treatment: "Consultation Facial", benefit: "Personalized assessment", frequency: "Monthly", complementsHomecare: "Guides home routine" }],
        expectedResults: { week1: "Adjustment period", month1: "Initial improvements", month3: "Visible results" },
        tips: [{ category: "lifestyle", tip: "Stay consistent with your routine" }]
      };
    }

    // Save to database
    const savedRec = await prisma.aIProductRecommendation.create({
      data: {
        skinType,
        hairType,
        concerns,
        allergies: allergies || [],
        budget,
        preferences: preferences || {},
        products: { skincare: recommendations.skincare, haircare: recommendations.haircare },
        routines: recommendations.routines,
        alternatives: recommendations.budgetOptions,
      },
    });

    return NextResponse.json({
      success: true,
      id: savedRec.id,
      recommendations,
    });
  } catch (error) {
    console.error("Product recommender error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
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
      const recommendation = await prisma.aIProductRecommendation.findUnique({
        where: { id },
      });
      return NextResponse.json({ success: true, data: recommendation });
    }

    const where = clientId ? { clientId } : {};

    const recommendations = await prisma.aIProductRecommendation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Error fetching product recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
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

    await prisma.aIProductRecommendation.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting product recommendation:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
