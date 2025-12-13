import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

// POST /api/ai/booking-assistant - AI-powered booking assistant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, clientId, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // Get client info if provided
    let clientContext = "";
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          appointments: {
            where: { status: "COMPLETED" },
            orderBy: { scheduledStart: "desc" },
            take: 5,
            include: {
              services: {
                include: {
                  service: { select: { name: true } },
                },
              },
              staff: {
                select: { displayName: true },
              },
            },
          },
          preferences: true,
        },
      });

      if (client) {
        const recentServices = client.appointments
          .flatMap((a) => a.services.map((s) => s.service.name))
          .slice(0, 5);

        const preferredStaff = client.appointments[0]?.staff?.displayName;

        clientContext = `
CLIENT INFO:
- Name: ${client.firstName} ${client.lastName}
- Recent services: ${recentServices.join(", ") || "None"}
- Preferred staff: ${preferredStaff || "No preference"}
- Preferences: ${client.preferences.map((p) => `${p.category}: ${p.value}`).join(", ") || "None recorded"}
`;
      }
    }

    // Get available services
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        name: true,
        duration: true,
        price: true,
        description: true,
        category: {
          select: { name: true },
        },
      },
      take: 30,
    });

    const servicesContext = services
      .map(
        (s) =>
          `- ${s.name} (${s.category?.name || "General"}): ${s.duration} min, $${Number(s.price)}`
      )
      .join("\n");

    // Get available staff
    const staff = await prisma.staff.findMany({
      where: { isActive: true, isBookableOnline: true },
      select: {
        displayName: true,
        specialties: true,
        avgRating: true,
      },
    });

    const staffContext = staff
      .map(
        (s) =>
          `- ${s.displayName}: Specialties: ${s.specialties.join(", ") || "General"}, Rating: ${s.avgRating || "N/A"}`
      )
      .join("\n");

    // Build conversation for AI
    const systemPrompt = `You are a friendly and professional AI booking assistant for a beauty & wellness salon. Help clients book appointments, recommend services, and answer questions.

AVAILABLE SERVICES:
${servicesContext}

AVAILABLE STAFF:
${staffContext}

${clientContext}

GUIDELINES:
1. Be warm, helpful, and professional
2. If the client mentions a specific service, confirm the details (duration, price)
3. If they have preferences from past visits, mention them
4. Suggest add-on services when appropriate
5. Ask about preferred date/time and staff member
6. Confirm all booking details before finalizing
7. If you need to book, respond with a JSON action at the end

When ready to create a booking, include this JSON at the end of your response:
{"action": "book", "service": "service name", "staff": "staff name or null", "duration": minutes, "notes": "any special requests"}

When suggesting availability, include:
{"action": "check_availability", "service": "service name", "preferredDate": "YYYY-MM-DD or null"}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory.map(
        (msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      ),
      { role: "user" as const, content: message },
    ];

    const response = await openRouterChat(messages);

    // Parse any action from the response
    let action = null;
    const jsonMatch = response.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        action = JSON.parse(jsonMatch[0]);
      } catch {
        // No valid JSON action
      }
    }

    // Clean response (remove JSON if present)
    const cleanResponse = response
      .replace(/\{[\s\S]*"action"[\s\S]*\}/, "")
      .trim();

    return NextResponse.json({
      response: cleanResponse,
      action,
      conversationHistory: [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: cleanResponse },
      ],
    });
  } catch (error) {
    console.error("Error in booking assistant:", error);
    return NextResponse.json(
      { error: "Failed to process booking request" },
      { status: 500 }
    );
  }
}
