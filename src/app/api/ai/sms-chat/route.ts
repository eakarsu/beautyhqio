import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, clientPhone, history = [] } = body as {
      message: string;
      clientPhone?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const user = await getAuthenticatedUser();
    const businessId = user?.businessId;

    const business = businessId
      ? await prisma.business.findUnique({ where: { id: businessId } })
      : await prisma.business.findFirst();

    if (!business) {
      return NextResponse.json(
        { error: "No business configured" },
        { status: 404 }
      );
    }

    const [services, locations] = await Promise.all([
      prisma.service.findMany({
        where: { businessId: business.id, isActive: true },
        select: { name: true, duration: true, price: true, description: true },
        take: 30,
      }),
      prisma.location.findMany({
        where: { businessId: business.id, isActive: true },
        select: {
          name: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          phone: true,
          operatingHours: true,
        },
      }),
    ]);

    let knownClient: { firstName: string; visitCount: number } | null = null;
    if (clientPhone) {
      const cleaned = clientPhone.replace(/\D/g, "");
      const found = await prisma.client.findFirst({
        where: {
          businessId: business.id,
          phone: { contains: cleaned.slice(-10) },
        },
        select: {
          firstName: true,
          _count: { select: { appointments: true } },
        },
      });
      if (found) {
        knownClient = {
          firstName: found.firstName,
          visitCount: found._count.appointments,
        };
      }
    }

    const businessContext = {
      businessName: business.name,
      services: services.map((s) => ({
        name: s.name,
        durationMin: s.duration,
        price: Number(s.price),
        description: s.description,
      })),
      locations: locations.map((l) => ({
        name: l.name,
        address: [l.address, l.city, l.state, l.zip].filter(Boolean).join(", "),
        phone: l.phone,
        hours: l.operatingHours,
      })),
      knownClient,
    };

    const systemPrompt = `You are a friendly SMS receptionist for ${business.name}. Respond like a real human texting a customer — short, warm, natural. SMS rules:
- Keep replies under 320 characters when possible (one or two SMS segments)
- Use plain text, no markdown, no asterisks, no headers
- Use line breaks sparingly
- If the customer asks about services, prices, or hours, use ONLY the data below — never make up specifics
- If you don't know something, ask them to call the salon
- If they want to book, ask which service and preferred time

BUSINESS DATA:
${JSON.stringify(businessContext, null, 2)}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-8),
      { role: "user" as const, content: message },
    ];

    const reply = await openRouterChat(messages, {
      maxTokens: 500,
      temperature: 0.6,
    });

    return NextResponse.json({
      success: true,
      reply: reply.trim(),
    });
  } catch (error) {
    console.error("SMS Chat AI Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate reply",
      },
      { status: 500 }
    );
  }
}
