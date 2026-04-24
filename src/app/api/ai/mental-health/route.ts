import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouterChat } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, moodScore, stressLevel, anxietyLevel, sleepQuality, previousMessages } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Please provide a message" },
        { status: 400 }
      );
    }

    const conversationHistory = previousMessages || [];

    const systemPrompt = `You are a compassionate wellness companion focused on mental wellbeing in the context of a beauty and wellness salon. Your role is to:

1. Provide emotional support and active listening
2. Suggest self-care activities and wellness practices
3. Recommend relaxation techniques and stress management
4. Connect mental wellbeing to beauty/wellness services (massage, spa treatments, aromatherapy)
5. Recognize when professional mental health support is needed

Current client status:
- Mood Score: ${moodScore || "Not provided"}/10
- Stress Level: ${stressLevel || "Not provided"}/10
- Anxiety Level: ${anxietyLevel || "Not provided"}/10
- Sleep Quality: ${sleepQuality || "Not provided"}/10

Guidelines:
- Be warm, supportive, and non-judgmental
- Suggest practical coping strategies
- Recommend spa/wellness services when appropriate
- If the person expresses serious distress, self-harm thoughts, or crisis, immediately recommend professional help and provide crisis resources
- Focus on wellness, self-care, and lifestyle improvements

Respond with empathy and provide actionable suggestions. Return your response as a JSON object with these fields:
{
  "conversationalResponse": "Your empathetic response text here",
  "emotionalTone": "supportive|concerned|encouraging|celebratory",
  "identifiedConcerns": ["concern1", "concern2"],
  "copingStrategies": ["strategy1", "strategy2", "strategy3"],
  "suggestedServices": ["Relaxation Massage", "Aromatherapy Session"],
  "needsProfessionalHelp": false,
  "crisisDetected": false,
  "followUpQuestions": ["question1", "question2"]
}

IMPORTANT: Return ONLY the raw JSON object. Do NOT wrap it in markdown code blocks or any other formatting.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await openRouterChat(messages, { temperature: 0.7, maxTokens: 10000 });

    // Parse the response to extract the conversational part and JSON analysis
    let conversationalResponse = response;
    let analysis = {
      emotionalTone: "supportive",
      identifiedConcerns: [],
      copingStrategies: ["Deep breathing exercises", "Take a relaxing bath", "Practice gratitude journaling"],
      suggestedServices: ["Relaxation Massage", "Aromatherapy"],
      needsProfessionalHelp: false,
      crisisDetected: false,
      followUpQuestions: [],
    };

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.conversationalResponse) {
          conversationalResponse = parsed.conversationalResponse;
        }
        analysis = {
          emotionalTone: parsed.emotionalTone || analysis.emotionalTone,
          identifiedConcerns: parsed.identifiedConcerns || analysis.identifiedConcerns,
          copingStrategies: parsed.copingStrategies || analysis.copingStrategies,
          suggestedServices: parsed.suggestedServices || analysis.suggestedServices,
          needsProfessionalHelp: parsed.needsProfessionalHelp || analysis.needsProfessionalHelp,
          crisisDetected: parsed.crisisDetected || analysis.crisisDetected,
          followUpQuestions: parsed.followUpQuestions || analysis.followUpQuestions,
        };
      }
    } catch {
      // Keep default analysis
    }

    // Check for crisis keywords
    const crisisKeywords = ["suicide", "kill myself", "end my life", "self-harm", "hurt myself", "don't want to live"];
    const hasCrisisKeywords = crisisKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );

    if (hasCrisisKeywords) {
      analysis.crisisDetected = true;
      analysis.needsProfessionalHelp = true;
      conversationalResponse += "\n\n⚠️ **Important:** I'm concerned about what you've shared. Please reach out to a mental health professional or crisis helpline immediately:\n\n- **National Suicide Prevention Lifeline:** 988\n- **Crisis Text Line:** Text HOME to 741741\n- **International Association for Suicide Prevention:** https://www.iasp.info/resources/Crisis_Centres/\n\nYou matter, and help is available 24/7.";
    }

    // Save or update session
    const existingSession = sessionId
      ? await prisma.mentalHealthSession.findFirst({ where: { sessionId } })
      : null;

    const updatedMessages = [
      ...conversationHistory,
      { role: "user", content: message },
      { role: "assistant", content: conversationalResponse },
    ];

    let savedSession;
    if (existingSession) {
      savedSession = await prisma.mentalHealthSession.update({
        where: { id: existingSession.id },
        data: {
          moodScore,
          stressLevel,
          anxietyLevel,
          sleepQuality,
          messages: updatedMessages,
          insights: analysis.identifiedConcerns,
          copingStrategies: analysis.copingStrategies,
          resourcesRecommended: analysis.suggestedServices,
          needsProfessionalHelp: analysis.needsProfessionalHelp,
          crisisDetected: analysis.crisisDetected,
        },
      });
    } else {
      savedSession = await prisma.mentalHealthSession.create({
        data: {
          sessionId: sessionId || `mh-${Date.now()}`,
          moodScore,
          stressLevel,
          anxietyLevel,
          sleepQuality,
          messages: updatedMessages,
          insights: analysis.identifiedConcerns,
          copingStrategies: analysis.copingStrategies,
          resourcesRecommended: analysis.suggestedServices,
          needsProfessionalHelp: analysis.needsProfessionalHelp,
          crisisDetected: analysis.crisisDetected,
        },
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: savedSession.sessionId,
      response: conversationalResponse,
      analysis,
      disclaimer: "This is wellness support, not therapy. For mental health concerns, please consult a licensed professional.",
    });
  } catch (error) {
    console.error("Mental health companion error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (sessionId) {
      const session = await prisma.mentalHealthSession.findFirst({
        where: { sessionId },
      });
      return NextResponse.json({ success: true, data: session });
    }

    const sessions = await prisma.mentalHealthSession.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        sessionId: true,
        moodScore: true,
        stressLevel: true,
        createdAt: true,
        needsProfessionalHelp: true,
      },
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Error fetching mental health sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
