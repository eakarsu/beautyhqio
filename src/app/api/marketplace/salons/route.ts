import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { BusinessType } from "@prisma/client";
import { endpoint } from "@/lib/operations/core";

/**
 * PUBLIC ENDPOINT — marketplace salon search.
 *
 * Anonymous shoppers browse the marketplace without a session, so this route
 * deliberately does not call context(). Only listed salons with an active/trial
 * subscription are returned, and the projection contains public listing fields
 * plus a single public location and featured services. No PII, credentials or
 * tenant-internal settings are selected.
 */
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const searchParams = request.nextUrl.searchParams;

    // Search & filter params
    const query = searchParams.get("q");
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const category = searchParams.get("category") as BusinessType | null;
    const service = searchParams.get("service");
    const minRating = searchParams.get("minRating");
    const priceRange = searchParams.get("priceRange");

    // Pagination (capped)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );

    // Sorting
    const sortBy = searchParams.get("sortBy") || "rating"; // rating, reviews, name

    // Build where clause
    const where: any = {
      isListed: true,
      business: {
        subscription: {
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        locations: {
          some: {
            isActive: true,
            ...(city && { city: { contains: city, mode: "insensitive" } }),
            ...(state && { state: { equals: state, mode: "insensitive" } }),
          },
        },
        ...(category && { type: category }),
      },
    };

    // Filter by rating
    if (minRating) {
      where.avgRating = { gte: parseFloat(minRating) };
    }

    // Filter by price range
    if (priceRange) {
      where.priceRange = priceRange;
    }

    // Text search in headline/description/specialties
    if (query) {
      where.OR = [
        { headline: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { specialties: { has: query } },
        {
          business: {
            name: { contains: query, mode: "insensitive" },
          },
        },
        {
          business: {
            services: {
              some: {
                name: { contains: query, mode: "insensitive" },
                isActive: true,
                allowOnline: true,
              },
            },
          },
        },
      ];
    }

    // Filter by specific service
    if (service) {
      where.business = {
        ...where.business,
        services: {
          some: {
            name: { contains: service, mode: "insensitive" },
            isActive: true,
            allowOnline: true,
          },
        },
      };
    }

    // Sorting
    let orderBy: any;
    switch (sortBy) {
      case "reviews":
        orderBy = { reviewCount: "desc" };
        break;
      case "name":
        orderBy = { business: { name: "asc" } };
        break;
      case "rating":
      default:
        orderBy = [{ avgRating: "desc" }, { reviewCount: "desc" }];
        break;
    }

    // Fetch salons
    const [salons, total] = await Promise.all([
      prisma.publicSalonProfile.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              type: true,
              logo: true,
              locations: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  state: true,
                  zip: true,
                  phone: true,
                  latitude: true,
                  longitude: true,
                },
                take: 1,
              },
              services: {
                where: { isActive: true, allowOnline: true },
                select: {
                  id: true,
                  name: true,
                  price: true,
                  duration: true,
                },
                take: 5,
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.publicSalonProfile.count({ where }),
    ]);

    // Format response
    const formattedSalons = salons.map((salon) => ({
      id: salon.id,
      slug: salon.slug,
      businessId: salon.business.id,
      name: salon.business.name,
      type: salon.business.type,
      logo: salon.business.logo,
      coverImage: salon.coverImage,
      headline: salon.headline,
      description: salon.description,
      specialties: salon.specialties,
      avgRating: salon.avgRating ? Number(salon.avgRating) : null,
      reviewCount: salon.reviewCount,
      priceRange: salon.priceRange,
      isVerified: salon.isVerified,
      location: salon.business.locations[0] || null,
      featuredServices: salon.business.services.map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        duration: s.duration,
      })),
    }));

    return {
      salons: formattedSalons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        query,
        city,
        state,
        category,
        minRating,
        priceRange,
        sortBy,
      },
    };
  });
}
