import { NextRequest } from "next/server";
import { context, endpoint } from "@/lib/operations/core";
import { prisma } from "@/lib/prisma";

// GET /api/all-marketplace - Marketplace profiles.
//
// SECURITY DECISION: this handler returns tenant-internal listing data (the
// profile id, unlisted profiles, cached view/booking analytics), and it is the
// data source for the authenticated `(dashboard)/marketplace` management page.
// It is therefore NOT a public browsing endpoint and must be authenticated.
// Marketplace browsing for anonymous visitors should read the explicitly public
// projection by slug. We scope the query to the caller's own business; a
// platform administrator may review every business.
export async function GET(_request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);

    const profiles = await prisma.publicSalonProfile.findMany({
      where: ctx.user.isPlatformAdmin ? {} : { businessId: ctx.businessId },
      include: {
        business: {
          select: {
            name: true,
            type: true,
          }
        }
      },
      orderBy: { viewCount: "desc" },
      take: 200,
    });

    return {
      total: profiles.length,
      profiles: profiles.map(p => ({
        id: p.id,
        businessName: p.business.name,
        businessType: p.business.type,
        slug: p.slug,
        isListed: p.isListed,
        headline: p.headline,
        specialties: p.specialties,
        amenities: p.amenities,
        priceRange: p.priceRange,
        avgRating: p.avgRating ? Number(p.avgRating) : null,
        reviewCount: p.reviewCount,
        viewCount: p.viewCount,
        bookingClickCount: p.bookingClickCount,
        isVerified: p.isVerified,
      }))
    };
  });
}
