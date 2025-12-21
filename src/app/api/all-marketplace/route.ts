import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/all-marketplace - Get all marketplace profiles
export async function GET(request: NextRequest) {
  try {
    const profiles = await prisma.publicSalonProfile.findMany({
      include: {
        business: {
          select: {
            name: true,
            type: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: { viewCount: "desc" }
    });

    return NextResponse.json({
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
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
