import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouter } from "@/lib/openrouter";

// POST /api/ai/style-recommendation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, preferences, hairType, skinType, lifestyle, image } = body;

    // If image is provided (direct upload mode), use OpenRouter AI for analysis
    if (image) {
      // Use OpenRouter to analyze preferences and generate recommendations
      const aiResult = await openRouter.analyzePhotoForStyle({
        hairLength: preferences?.hairLength,
        hairType: preferences?.hairType,
        lifestyle: preferences?.lifestyle,
        maintenance: preferences?.maintenance,
        notes: preferences?.notes,
      });

      return NextResponse.json({
        success: true,
        faceShape: aiResult.faceShape,
        recommendations: aiResult.recommendations,
      });
    }

    // Client-based recommendation mode
    if (!clientId) {
      return NextResponse.json(
        { error: "Either image or clientId is required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Get previous services
    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: client.id,
        status: "COMPLETED",
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { scheduledStart: "desc" },
      take: 10,
    });

    const previousServices: string[] = [];
    for (const apt of appointments) {
      for (const aptService of apt.services) {
        if (aptService.service?.name && !previousServices.includes(aptService.service.name)) {
          previousServices.push(aptService.service.name);
        }
      }
    }

    const recommendation = await openRouter.getStyleRecommendation({
      name: `${client.firstName} ${client.lastName}`,
      preferences: preferences || (client.notes as string) || undefined,
      previousServices,
      hairType,
      skinType,
      lifestyle,
    });

    return NextResponse.json({
      success: true,
      recommendation,
      clientInfo: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        previousServices,
      },
    });
  } catch (error) {
    console.error("Style recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
