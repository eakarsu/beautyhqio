import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

// POST /api/ai/social-media - Generate social media content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type = "post",
      platform = "instagram",
      topic,
      serviceId,
      tone = "professional",
      includeHashtags = true,
      includeEmoji = true,
    } = body;

    // Get business context
    let serviceContext = "";
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { category: true },
      });
      if (service) {
        serviceContext = `
Feature Service:
- Name: ${service.name}
- Category: ${service.category?.name}
- Price: $${service.price}
- Duration: ${service.duration} minutes
- Description: ${service.description || "Premium beauty service"}
`;
      }
    }

    // Get recent popular services
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const popularServices = await prisma.appointmentService.groupBy({
      by: ["serviceId"],
      where: {
        appointment: {
          createdAt: { gte: thirtyDaysAgo },
          status: "COMPLETED",
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const popularServiceDetails = await prisma.service.findMany({
      where: {
        id: { in: popularServices.map((s) => s.serviceId) },
      },
    });

    const trendingServices = popularServiceDetails
      .map((s) => s.name)
      .join(", ");

    // Platform-specific guidelines
    const platformGuidelines: Record<string, string> = {
      instagram: `Instagram post guidelines:
- Optimal length: 125-150 characters for captions
- Can be longer (up to 2200 chars) for storytelling
- Visual-first, caption supports the image
- Use line breaks for readability
- 20-30 hashtags at the end`,

      facebook: `Facebook post guidelines:
- Optimal length: 40-80 characters for engagement
- Can include longer form content
- Conversational tone works well
- Include a call to action
- 1-2 hashtags max`,

      twitter: `Twitter/X post guidelines:
- Max 280 characters
- Punchy and direct
- Include a hook
- 2-3 relevant hashtags
- Can thread for longer content`,

      tiktok: `TikTok caption guidelines:
- Short and catchy (50-100 characters)
- Trendy language
- Reference trending sounds/challenges if relevant
- 3-5 hashtags including trending ones`,

      linkedin: `LinkedIn post guidelines:
- Professional tone
- Industry insights
- Longer form acceptable (up to 3000 chars)
- Business accomplishments
- 3-5 relevant hashtags`,
    };

    const contentTypes: Record<string, string> = {
      post: "a regular social media post",
      promotion: "a promotional post highlighting a special offer",
      educational: "an educational post sharing beauty tips",
      behindthescenes: "a behind-the-scenes look at the salon",
      testimonial: "a client testimonial or success story",
      seasonal: "a seasonal/holiday themed post",
      announcement: "an announcement about new services or changes",
    };

    const toneDescriptions: Record<string, string> = {
      professional: "professional and polished",
      casual: "casual and friendly",
      luxurious: "luxurious and exclusive",
      fun: "fun and playful",
      educational: "informative and educational",
      inspirational: "inspirational and motivating",
    };

    const prompt = `Create ${contentTypes[type] || "a social media post"} for a beauty and wellness salon.

Platform: ${platform}
${platformGuidelines[platform] || ""}

Tone: ${toneDescriptions[tone] || tone}
Topic: ${topic || "General beauty and wellness"}
Include hashtags: ${includeHashtags}
Include emojis: ${includeEmoji}

${serviceContext}

Trending services at our salon: ${trendingServices || "Hair, Nails, Skincare"}

Generate content as JSON:
{
  "mainPost": "the main caption/post text",
  "alternativeVersions": ["2-3 alternative versions"],
  "hashtags": ["relevant", "hashtags"],
  "bestTimeToPost": "suggested posting time",
  "engagementTips": ["tips to boost engagement"],
  "visualSuggestion": "description of ideal image/video to pair with post"
}`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content: `You are a social media expert for a beauty and wellness salon. Create engaging, platform-optimized content that drives engagement and bookings. Always respond with valid JSON.`,
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 1000, temperature: 0.8 }
    );

    let content;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      content = jsonMatch ? JSON.parse(jsonMatch[0]) : { mainPost: response };
    } catch {
      content = { mainPost: response };
    }

    return NextResponse.json({
      platform,
      type,
      tone,
      content,
    });
  } catch (error) {
    console.error("Error generating social media content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

// GET /api/ai/social-media - Get content calendar suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");

    // Get upcoming holidays/events
    const today = new Date();
    const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    // Generate content calendar
    const prompt = `Create a ${days}-day social media content calendar for a beauty and wellness salon.

Date range: ${today.toDateString()} to ${endDate.toDateString()}

Include:
1. Mix of content types (promotional, educational, engagement, behind-the-scenes)
2. Platform recommendations for each post
3. Best times to post
4. Any relevant holidays or events in this period
5. Content themes that perform well in beauty industry

Return as JSON:
{
  "calendar": [
    {
      "date": "YYYY-MM-DD",
      "dayOfWeek": "Monday",
      "posts": [
        {
          "platform": "instagram",
          "type": "educational",
          "topic": "description",
          "bestTime": "10:00 AM",
          "priority": "high|medium|low"
        }
      ],
      "specialNote": "any holiday or event"
    }
  ],
  "weeklyThemes": ["theme1", "theme2"],
  "contentMix": {
    "promotional": percentage,
    "educational": percentage,
    "engagement": percentage,
    "behindScenes": percentage
  }
}`;

    const response = await openRouterChat(
      [
        {
          role: "system",
          content:
            "You are a social media strategist for beauty businesses. Create data-driven content calendars. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 2000, temperature: 0.7 }
    );

    let calendar;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      calendar = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response };
    } catch {
      calendar = { raw: response };
    }

    return NextResponse.json({
      days,
      startDate: today.toDateString(),
      endDate: endDate.toDateString(),
      calendar,
    });
  } catch (error) {
    console.error("Error generating content calendar:", error);
    return NextResponse.json(
      { error: "Failed to generate content calendar" },
      { status: 500 }
    );
  }
}
