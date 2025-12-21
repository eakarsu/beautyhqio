import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Generate a URL-friendly slug from business name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /api/business/profile/public - Get public profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });

    if (!user?.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get or create public profile
    let profile = await prisma.publicSalonProfile.findUnique({
      where: { businessId: user.business.id },
    });

    if (!profile) {
      // Create default profile
      const slug = generateSlug(user.business.name);
      let uniqueSlug = slug;
      let counter = 1;

      // Ensure slug is unique
      while (await prisma.publicSalonProfile.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      profile = await prisma.publicSalonProfile.create({
        data: {
          businessId: user.business.id,
          slug: uniqueSlug,
          isListed: true,
          specialties: [],
          amenities: [],
          galleryImages: [],
        },
      });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        avgRating: profile.avgRating ? Number(profile.avgRating) : null,
      },
      previewUrl: `/salon/${profile.slug}`,
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/business/profile/public - Update public profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });

    if (!user?.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      slug,
      isListed,
      metaTitle,
      metaDescription,
      headline,
      description,
      specialties,
      amenities,
      coverImage,
      galleryImages,
      priceRange,
    } = body;

    // Check if slug is already taken by another business
    if (slug) {
      const existingProfile = await prisma.publicSalonProfile.findUnique({
        where: { slug },
      });
      if (existingProfile && existingProfile.businessId !== user.business.id) {
        return NextResponse.json(
          { error: "This URL slug is already taken" },
          { status: 400 }
        );
      }
    }

    // Update or create profile
    const profile = await prisma.publicSalonProfile.upsert({
      where: { businessId: user.business.id },
      update: {
        ...(slug && { slug }),
        ...(isListed !== undefined && { isListed }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(headline !== undefined && { headline }),
        ...(description !== undefined && { description }),
        ...(specialties && { specialties }),
        ...(amenities && { amenities }),
        ...(coverImage !== undefined && { coverImage }),
        ...(galleryImages && { galleryImages }),
        ...(priceRange !== undefined && { priceRange }),
      },
      create: {
        businessId: user.business.id,
        slug: slug || generateSlug(user.business.name),
        isListed: isListed ?? true,
        metaTitle,
        metaDescription,
        headline,
        description,
        specialties: specialties || [],
        amenities: amenities || [],
        coverImage,
        galleryImages: galleryImages || [],
        priceRange,
      },
    });

    return NextResponse.json({
      profile: {
        ...profile,
        avgRating: profile.avgRating ? Number(profile.avgRating) : null,
      },
      previewUrl: `/salon/${profile.slug}`,
    });
  } catch (error) {
    console.error("Error updating public profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
