import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId } = body;

    // Fetch business data for analysis
    let loyaltyProgram = null;
    let memberCount = 0;
    let recentTransactions = [];
    let businessInfo = null;

    if (businessId) {
      businessInfo = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          loyaltyProgram: {
            include: {
              accounts: true,
              rewards: true,
            },
          },
        },
      });

      loyaltyProgram = businessInfo?.loyaltyProgram;
      memberCount = loyaltyProgram?.accounts?.length || 0;
    }

    const programData = loyaltyProgram
      ? {
          pointsPerDollar: Number(loyaltyProgram.pointsPerDollar),
          bonusOnSignup: loyaltyProgram.bonusOnSignup,
          bonusOnBirthday: loyaltyProgram.bonusOnBirthday,
          bonusOnReferral: loyaltyProgram.bonusOnReferral,
          rewardsCount: loyaltyProgram.rewards?.length || 0,
          memberCount,
        }
      : {
          pointsPerDollar: 1,
          bonusOnSignup: 0,
          bonusOnBirthday: 0,
          bonusOnReferral: 0,
          rewardsCount: 0,
          memberCount: 0,
        };

    const prompt = `You are a loyalty program optimization expert for beauty and wellness businesses. Analyze this loyalty program and provide strategic recommendations.

Current Program Data:
- Points per Dollar Spent: ${programData.pointsPerDollar}
- Signup Bonus Points: ${programData.bonusOnSignup}
- Birthday Bonus Points: ${programData.bonusOnBirthday}
- Referral Bonus Points: ${programData.bonusOnReferral}
- Number of Rewards Available: ${programData.rewardsCount}
- Current Member Count: ${programData.memberCount}
- Business Type: ${businessInfo?.type || "Beauty/Wellness Salon"}

Provide comprehensive optimization recommendations in this exact JSON format:
{
  "currentAssessment": {
    "overallScore": 65,
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"]
  },
  "programSuggestions": [
    {
      "category": "earning|rewards|tiers|engagement|technology",
      "suggestion": "Specific suggestion",
      "currentState": "What it is now",
      "recommendedChange": "What to change to",
      "expectedImpact": "Quantified expected impact",
      "priority": "high|medium|low",
      "implementation": "How to implement"
    }
  ],
  "rewardOptimizations": [
    {
      "rewardType": "discount|free_service|product|experience|exclusive",
      "suggestion": "Specific reward suggestion",
      "pointsCost": 500,
      "perceivedValue": "High|Medium|Low",
      "costToBusiness": "Low|Medium|High",
      "appeal": "Who this appeals to"
    }
  ],
  "tierStructure": {
    "recommended": true,
    "tiers": [
      {
        "name": "Tier Name",
        "requirement": "How to reach this tier",
        "benefits": ["Benefit 1", "Benefit 2"],
        "color": "Bronze|Silver|Gold|Platinum"
      }
    ]
  },
  "engagementStrategies": [
    {
      "strategy": "Strategy name",
      "description": "How it works",
      "targetAudience": "Who it targets",
      "expectedEngagement": "Expected increase",
      "frequency": "How often to run"
    }
  ],
  "retentionTactics": [
    {
      "tactic": "Tactic name",
      "trigger": "When to use",
      "action": "What to do",
      "expectedOutcome": "Expected result"
    }
  ],
  "gamificationIdeas": [
    {
      "feature": "Feature name",
      "description": "How it works",
      "engagement": "Expected engagement boost"
    }
  ],
  "communicationStrategy": {
    "channels": ["SMS", "Email", "App Push"],
    "frequency": "Recommended frequency",
    "keyMessages": [
      {
        "trigger": "When to send",
        "message": "Message type/content"
      }
    ]
  },
  "metrics": {
    "currentProjected": {
      "memberGrowth": "X% per month",
      "redemptionRate": "X%",
      "retentionImprovement": "X%"
    },
    "withOptimizations": {
      "memberGrowth": "X% per month",
      "redemptionRate": "X%",
      "retentionImprovement": "X%"
    }
  },
  "implementationRoadmap": {
    "immediate": ["Action 1", "Action 2"],
    "shortTerm": ["Action 1", "Action 2"],
    "longTerm": ["Action 1", "Action 2"]
  },
  "budgetConsiderations": {
    "lowCost": ["Idea that costs little"],
    "mediumInvestment": ["Idea requiring moderate investment"],
    "premiumInvestment": ["Premium idea worth investing in"]
  }
}

Provide specific, actionable recommendations tailored to a beauty and wellness business.`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content: "You are a loyalty program expert specializing in beauty and wellness businesses. Provide data-driven, actionable recommendations to improve program performance. Respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.6, maxTokens: 10000 }
    );

    let optimization;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        optimization = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response");
      }
    } catch {
      optimization = {
        currentAssessment: {
          overallScore: 50,
          strengths: ["Basic program in place"],
          weaknesses: ["Limited data for analysis"],
          opportunities: ["Room for growth"]
        },
        programSuggestions: [
          { category: "engagement", suggestion: "Implement member enrollment drive", currentState: "Basic", recommendedChange: "Active promotion", expectedImpact: "20% member growth", priority: "high", implementation: "Train staff on enrollment" }
        ],
        rewardOptimizations: [
          { rewardType: "discount", suggestion: "Add $10 off reward", pointsCost: 100, perceivedValue: "High", costToBusiness: "Low", appeal: "All members" }
        ],
        tierStructure: { recommended: true, tiers: [{ name: "Bronze", requirement: "Join", benefits: ["Points earning"], color: "Bronze" }] },
        engagementStrategies: [{ strategy: "Monthly bonus events", description: "Double points days", targetAudience: "All members", expectedEngagement: "25% boost", frequency: "Monthly" }],
        retentionTactics: [{ tactic: "Re-engagement campaign", trigger: "60 days inactive", action: "Send bonus points offer", expectedOutcome: "15% reactivation" }],
        gamificationIdeas: [{ feature: "Progress bar", description: "Show progress to next reward", engagement: "20% increase" }],
        communicationStrategy: { channels: ["SMS", "Email"], frequency: "Weekly", keyMessages: [{ trigger: "Points earned", message: "Balance update" }] },
        metrics: { currentProjected: { memberGrowth: "5%", redemptionRate: "20%", retentionImprovement: "5%" }, withOptimizations: { memberGrowth: "15%", redemptionRate: "35%", retentionImprovement: "20%" } },
        implementationRoadmap: { immediate: ["Audit current program"], shortTerm: ["Add new rewards"], longTerm: ["Implement tiers"] },
        budgetConsiderations: { lowCost: ["Email campaigns"], mediumInvestment: ["Staff training"], premiumInvestment: ["App development"] }
      };
    }

    // Save to database
    const savedOptimization = await prisma.aILoyaltyOptimization.create({
      data: {
        businessId: businessId || "default",
        programData,
        memberData: { memberCount },
        transactionData: { recentTransactions: recentTransactions.length },
        programSuggestions: optimization.programSuggestions,
        rewardOptimizations: optimization.rewardOptimizations,
        engagementStrategies: optimization.engagementStrategies,
        retentionTactics: optimization.retentionTactics,
        projectedROI: 0,
        projectedRetention: Number(optimization.metrics?.withOptimizations?.retentionImprovement?.replace("%", "")) || 0,
      },
    });

    return NextResponse.json({
      success: true,
      id: savedOptimization.id,
      optimization,
    });
  } catch (error) {
    console.error("Loyalty optimizer error:", error);
    return NextResponse.json(
      { error: "Failed to generate optimization recommendations" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const businessId = searchParams.get("businessId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (id) {
      const optimization = await prisma.aILoyaltyOptimization.findUnique({
        where: { id },
      });
      return NextResponse.json({ success: true, data: optimization });
    }

    const where = businessId ? { businessId } : {};

    const optimizations = await prisma.aILoyaltyOptimization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: optimizations });
  } catch (error) {
    console.error("Error fetching loyalty optimizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch optimizations" },
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

    await prisma.aILoyaltyOptimization.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting loyalty optimization:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
