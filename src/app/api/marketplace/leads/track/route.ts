import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MarketplaceSource, LeadStatusType } from "@prisma/client";

// POST /api/marketplace/leads/track - Track lead events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      event,
      businessId,
      locationId,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      searchQuery,
    } = body;

    if (!sessionId || !event || !businessId) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, event, businessId" },
        { status: 400 }
      );
    }

    // Find existing lead for this session and business
    let lead = await prisma.marketplaceLead.findFirst({
      where: {
        sessionId,
        businessId,
      },
    });

    // Map event to status
    const eventToStatus: Record<string, LeadStatusType> = {
      view_profile: "VIEWED_PROFILE",
      start_booking: "STARTED_BOOKING",
      complete_booking: "BOOKED",
      complete_appointment: "COMPLETED",
      cancel: "CANCELLED",
      no_show: "NO_SHOW",
    };

    const newStatus = eventToStatus[event];

    if (!lead) {
      // Create new lead
      lead = await prisma.marketplaceLead.create({
        data: {
          sessionId,
          businessId,
          locationId,
          source: (source as MarketplaceSource) || "MARKETPLACE_SEARCH",
          status: newStatus || "NEW",
          utmSource,
          utmMedium,
          utmCampaign,
          searchQuery,
        },
      });
    } else {
      // Update existing lead
      const updateData: any = {};

      if (newStatus) {
        updateData.status = newStatus;
      }

      if (event === "view_profile") {
        // Update view timestamp
        updateData.viewedAt = new Date();
      }

      if (event === "complete_booking") {
        updateData.bookedAt = new Date();
      }

      if (event === "complete_appointment") {
        updateData.completedAt = new Date();
      }

      if (locationId && !lead.locationId) {
        updateData.locationId = locationId;
      }

      if (Object.keys(updateData).length > 0) {
        lead = await prisma.marketplaceLead.update({
          where: { id: lead.id },
          data: updateData,
        });
      }
    }

    // If viewing profile, increment view count on public profile
    if (event === "view_profile") {
      await prisma.publicSalonProfile.updateMany({
        where: { businessId },
        data: { viewCount: { increment: 1 } },
      });
    }

    // If starting booking, increment booking click count
    if (event === "start_booking") {
      await prisma.publicSalonProfile.updateMany({
        where: { businessId },
        data: { bookingClickCount: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      status: lead.status,
    });
  } catch (error) {
    console.error("Error tracking lead:", error);
    return NextResponse.json(
      { error: "Failed to track lead" },
      { status: 500 }
    );
  }
}
