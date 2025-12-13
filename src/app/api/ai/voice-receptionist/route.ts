import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { generateTwiML } from "@/lib/twilio";

// POST /api/ai/voice-receptionist - AI-powered voice response generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { speechInput, from, context, language = "en" } = body;

    if (!speechInput) {
      return NextResponse.json(
        { error: "speechInput is required" },
        { status: 400 }
      );
    }

    // Try to find the client by phone number
    let clientContext = "";
    if (from) {
      const client = await prisma.client.findFirst({
        where: {
          phone: {
            contains: from.replace(/\D/g, "").slice(-10),
          },
        },
        include: {
          appointments: {
            where: {
              scheduledStart: { gte: new Date() },
              status: { in: ["CONFIRMED", "BOOKED"] },
            },
            include: {
              services: {
                include: { service: true },
              },
            },
            orderBy: { scheduledStart: "asc" },
            take: 3,
          },
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 3,
            include: {
              lineItems: { include: { service: true } },
            },
          },
        },
      });

      if (client) {
        const upcomingApts = client.appointments
          .map(
            (a) => {
              const serviceName = a.services[0]?.service?.name || "Service";
              return `${serviceName} on ${new Date(a.scheduledStart).toLocaleDateString()} at ${new Date(a.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
            }
          )
          .join(", ");

        const recentServices = [
          ...new Set(
            client.transactions.flatMap((t) =>
              t.lineItems.map((i) => i.service?.name).filter(Boolean)
            )
          ),
        ].join(", ");

        clientContext = `
Client Information:
- Name: ${client.firstName} ${client.lastName}
- Preferred Language: ${client.preferredLanguage || "en"}
- VIP Status: ${client.status === "VIP" ? "Yes" : "No"}
- Upcoming Appointments: ${upcomingApts || "None"}
- Recent Services: ${recentServices || "None"}
- Notes: ${client.notes || "None"}
`;
      }
    }

    // Get available services
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { name: true, duration: true, price: true },
      take: 20,
    });

    const servicesList = services
      .map((s) => `${s.name} ($${s.price}, ${s.duration} min)`)
      .join(", ");

    // Get available staff
    const staff = await prisma.staff.findMany({
      where: { isActive: true },
      select: {
        displayName: true,
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      take: 10,
    });

    const staffList = staff.map((s) => s.displayName || `${s.user.firstName} ${s.user.lastName}`).join(", ");

    const systemPrompt = `You are Sarah, a friendly AI receptionist for Serenity Salon and Spa.

CRITICAL RULES:
- NEVER include instructions, brackets, meta-commentary, or explanations in your response
- NEVER write things like "[If the client...]" or "(action: ...)"
- Respond ONLY with natural spoken dialogue - exactly what you would say out loud
- Keep responses under 50 words as they will be spoken aloud
- Be warm, helpful, and conversational

Your capabilities:
- Help clients book, check, or modify appointments
- Answer questions about services and pricing
- Transfer to a human if needed

Business Information:
- Services: ${servicesList || "haircuts, coloring, manicures, pedicures, facials, massages"}
- Staff: ${staffList || "our talented team of stylists and therapists"}

${clientContext}

Language: ${language}

Respond naturally as if speaking on the phone. Just speak - no stage directions or commentary.`;

    const response = await openRouterChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: speechInput },
      ],
      { maxTokens: 200, temperature: 0.7 }
    );

    // Determine if we need to take any actions
    const actions = [];
    const lowerResponse = response.toLowerCase();

    if (
      lowerResponse.includes("book") ||
      lowerResponse.includes("schedule") ||
      lowerResponse.includes("appointment")
    ) {
      actions.push("booking");
    }
    if (lowerResponse.includes("cancel") || lowerResponse.includes("reschedule")) {
      actions.push("modify");
    }
    if (lowerResponse.includes("transfer") || lowerResponse.includes("speak to")) {
      actions.push("transfer");
    }

    // Generate TwiML for voice response
    const twiml = generateTwiML({
      say: {
        text: response,
        voice: "Polly.Joanna",
        language: language === "en" ? "en-US" : language,
      },
      gather: {
        action: "/api/voice/ai-continue",
        timeout: 10,
        speechTimeout: "auto",
        input: ["speech"],
      },
    });

    return NextResponse.json({
      response,
      twiml,
      actions,
      clientFound: !!clientContext,
    });
  } catch (error) {
    console.error("Error in AI voice receptionist:", error);
    return NextResponse.json(
      { error: "Failed to process voice input" },
      { status: 500 }
    );
  }
}
