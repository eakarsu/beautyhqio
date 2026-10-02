import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { endpoint, fail } from "@/lib/operations/core";

/**
 * PUBLIC ENDPOINT — marketplace salon storefront profile.
 *
 * This is a public storefront, reached by anonymous shoppers, so it deliberately
 * does not call context(). It exposes only fields a public listing is expected to
 * show: the business's public contact/social details, bookable staff display
 * info, published services and public reviews (first name + last initial only).
 * Internal ids, credentials, client contact details and tenant settings are not
 * selected. Inactive/unsubscribed businesses return 404.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return endpoint(async () => {
    const { slug } = await params;

    const profile = await prisma.publicSalonProfile.findUnique({
      where: { slug },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            type: true,
            logo: true,
            phone: true,
            email: true,
            website: true,
            instagram: true,
            facebook: true,
            locations: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                address: true,
                address2: true,
                city: true,
                state: true,
                zip: true,
                phone: true,
                email: true,
                latitude: true,
                longitude: true,
                operatingHours: true,
                allowOnlineBooking: true,
              },
            },
            services: {
              where: { isActive: true, allowOnline: true },
              include: {
                category: {
                  select: { id: true, name: true },
                },
              },
              orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
            },
            serviceCategories: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!profile) return fail(404, "Salon not found");

    // Check if the business has an active subscription
    const subscription = await prisma.businessSubscription.findUnique({
      where: { businessId: profile.business.id },
    });

    if (!subscription || !["ACTIVE", "TRIAL"].includes(subscription.status)) {
      return fail(404, "This salon is not currently available");
    }

    // Get public-facing staff for the business
    const staff = await prisma.staff.findMany({
      where: {
        user: { businessId: profile.business.id },
        isActive: true,
        isBookableOnline: true,
      },
      select: {
        id: true,
        displayName: true,
        title: true,
        bio: true,
        photo: true,
        specialties: true,
        avgRating: true,
        reviewCount: true,
      },
    });

    // Get public reviews
    const reviews = await prisma.review.findMany({
      where: {
        isPublic: true,
        client: {
          appointments: {
            some: {
              location: {
                businessId: profile.business.id,
              },
            },
          },
        },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Increment view count (non-blocking)
    prisma.publicSalonProfile
      .update({
        where: { id: profile.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {}); // Ignore errors

    // Format services by category
    const servicesByCategory = profile.business.serviceCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      services: profile.business.services
        .filter((s) => s.categoryId === cat.id)
        .map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          duration: s.duration,
          price: Number(s.price),
          priceType: s.priceType,
        })),
    }));

    // Add uncategorized services
    const uncategorizedServices = profile.business.services
      .filter((s) => !s.categoryId)
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: Number(s.price),
        priceType: s.priceType,
      }));

    if (uncategorizedServices.length > 0) {
      servicesByCategory.push({
        id: "uncategorized",
        name: "Other Services",
        services: uncategorizedServices,
      });
    }

    return {
      profile: {
        id: profile.id,
        slug: profile.slug,
        headline: profile.headline,
        description: profile.description,
        specialties: profile.specialties,
        amenities: profile.amenities,
        coverImage: profile.coverImage,
        galleryImages: profile.galleryImages,
        avgRating: profile.avgRating ? Number(profile.avgRating) : null,
        reviewCount: profile.reviewCount,
        priceRange: profile.priceRange,
        isVerified: profile.isVerified,
      },
      business: {
        id: profile.business.id,
        name: profile.business.name,
        type: profile.business.type,
        logo: profile.business.logo,
        phone: profile.business.phone,
        email: profile.business.email,
        website: profile.business.website,
        instagram: profile.business.instagram,
        facebook: profile.business.facebook,
      },
      locations: profile.business.locations.map((loc) => ({
        ...loc,
        latitude: loc.latitude ? Number(loc.latitude) : null,
        longitude: loc.longitude ? Number(loc.longitude) : null,
      })),
      servicesByCategory,
      staff: staff.map((s) => ({
        ...s,
        avgRating: s.avgRating ? Number(s.avgRating) : null,
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        response: r.response,
        clientName: `${r.client.firstName} ${r.client.lastName?.charAt(0) || ""}.`,
      })),
    };
  });
}
