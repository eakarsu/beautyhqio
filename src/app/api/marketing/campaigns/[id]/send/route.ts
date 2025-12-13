import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/marketing/campaigns/[id]/send - Send campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.status === "sent") {
      return NextResponse.json(
        { error: "Campaign already sent" },
        { status: 400 }
      );
    }

    // Get target audience based on campaign's targeting options
    let clients: { id: string; email: string | null; phone: string; firstName: string }[] = [];

    const where: Record<string, unknown> = { status: "ACTIVE" };

    // Filter by target tags if specified
    if (campaign.targetTags && campaign.targetTags.length > 0) {
      where.tags = { hasSome: campaign.targetTags };
    }

    clients = await prisma.client.findMany({
      where,
      select: { id: true, email: true, phone: true, firstName: true },
    });

    // In a real implementation, this would integrate with email/SMS services
    // For now, we'll simulate sending and track the results

    const sent = clients.length;

    // Update campaign with results
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
        sentCount: sent,
        openCount: 0,
        clickCount: 0,
      },
    });

    // Create activity records for contacted clients
    for (const client of clients) {
      await prisma.activity.create({
        data: {
          clientId: client.id,
          type: "EMAIL_SENT",
          title: `Received campaign: ${campaign.name}`,
          description: campaign.subject || campaign.name,
          metadata: { campaignId: id, type: campaign.type },
        },
      });
    }

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      stats: {
        sent,
        recipients: clients.map((c) => c.id),
      },
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    return NextResponse.json(
      { error: "Failed to send campaign" },
      { status: 500 }
    );
  }
}
