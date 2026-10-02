import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { MarketplaceSource, LeadStatusType } from "@prisma/client";
import { endpoint, fail } from "@/lib/operations/core";

/**
 * PUBLIC ENDPOINT — anonymous marketplace lead analytics.
 *
 * Public storefront pages report browsing/booking events before the visitor has
 * a session, so this route intentionally does not call context(). It writes only
 * to the marketing/lead tables for the business being browsed and returns no
 * tenant data beyond the caller's own lead id. Inputs are zod-validated, the
 * business must exist, and any locationId must belong to that business, so the
 * endpoint cannot be used to write events into arbitrary tenants' records.
 */
const eventToStatus: Record<string, LeadStatusType> = {
  view_profile: "VIEWED_PROFILE",
  start_booking: "STARTED_BOOKING",
  complete_booking: "BOOKED",
  complete_appointment: "COMPLETED",
  cancel: "CANCELLED",
  no_show: "NO_SHOW",
};

const trackInput = z.object({
  sessionId: z.string().trim().min(1).max(191),
  event: z.enum([
    "view_profile",
    "start_booking",
    "complete_booking",
    "complete_appointment",
    "cancel",
    "no_show",
  ]),
  businessId: z.string().trim().min(1).max(191),
  locationId: z.string().trim().min(1).max(191).optional().nullable(),
  source: z.nativeEnum(MarketplaceSource).optional(),
  utmSource: z.string().trim().max(200).optional().nullable(),
  utmMedium: z.string().trim().max(200).optional().nullable(),
  utmCampaign: z.string().trim().max(200).optional().nullable(),
  searchQuery: z.string().trim().max(500).optional().nullable(),
});

// POST /api/marketplace/leads/track - Track lead events
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const input = trackInput.parse(await request.json());

    const business = await prisma.business.findUnique({
      where: { id: input.businessId },
      select: { id: true },
    });
    if (!business) return fail(404, "Business not found");

    if (input.locationId) {
      const location = await prisma.location.findFirst({
        where: { id: input.locationId, businessId: input.businessId },
        select: { id: true },
      });
      if (!location) return fail(400, "Invalid location");
    }

    const newStatus = eventToStatus[input.event];

    let lead = await prisma.marketplaceLead.findFirst({
      where: {
        sessionId: input.sessionId,
        businessId: input.businessId,
      },
    });

    if (!lead) {
      lead = await prisma.marketplaceLead.create({
        data: {
          sessionId: input.sessionId,
          businessId: input.businessId,
          locationId: input.locationId ?? null,
          source: input.source ?? "MARKETPLACE_SEARCH",
          status: newStatus || "NEW",
          utmSource: input.utmSource ?? null,
          utmMedium: input.utmMedium ?? null,
          utmCampaign: input.utmCampaign ?? null,
          searchQuery: input.searchQuery ?? null,
        },
      });
    } else {
      const updateData: Record<string, unknown> = {};

      if (newStatus) updateData.status = newStatus;
      if (input.event === "view_profile") updateData.viewedAt = new Date();
      if (input.event === "complete_booking") updateData.bookedAt = new Date();
      if (input.event === "complete_appointment") updateData.completedAt = new Date();
      if (input.locationId && !lead.locationId) updateData.locationId = input.locationId;

      if (Object.keys(updateData).length > 0) {
        lead = await prisma.marketplaceLead.update({
          where: { id: lead.id },
          data: updateData,
        });
      }
    }

    // If viewing profile, increment view count on the public profile
    if (input.event === "view_profile") {
      await prisma.publicSalonProfile.updateMany({
        where: { businessId: input.businessId },
        data: { viewCount: { increment: 1 } },
      });
    }

    // If starting booking, increment booking click count
    if (input.event === "start_booking") {
      await prisma.publicSalonProfile.updateMany({
        where: { businessId: input.businessId },
        data: { bookingClickCount: { increment: 1 } },
      });
    }

    return {
      success: true,
      leadId: lead.id,
      status: lead.status,
    };
  });
}
