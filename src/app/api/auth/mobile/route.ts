import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// Generate URL-friendly slug from business name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, email, name, providerId, accessToken } = body;

    // Validate required fields
    if (!provider || !email || !name || !providerId) {
      return NextResponse.json(
        { error: "Provider, email, name, and providerId are required" },
        { status: 400 }
      );
    }

    // Split name into first and last
    const nameParts = name.split(" ");
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || "";

    // Find existing user by email or create new one
    let user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user) {
      // Always use the FIRST existing business (the one with seeded demo data)
      // This ensures new users can see demo data immediately
      let business = await prisma.business.findFirst({
        orderBy: { createdAt: "asc" },
      });

      if (!business) {
        // Only create new business if none exists at all
        business = await prisma.business.create({
          data: {
            name: `${firstName}'s Business`,
            type: "MULTI_SERVICE",
            timezone: "America/New_York",
            defaultLanguage: "en",
            supportedLanguages: ["en"],
          },
        });

        // Create BusinessSubscription
        await prisma.businessSubscription.create({
          data: {
            businessId: business.id,
            plan: "STARTER",
            status: "ACTIVE",
            monthlyPrice: 0,
            marketplaceCommissionPct: 20,
          },
        });

        // Create PublicSalonProfile
        let slug = generateSlug(business.name);
        let uniqueSlug = slug;
        let counter = 1;

        while (await prisma.publicSalonProfile.findUnique({ where: { slug: uniqueSlug } })) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }

        await prisma.publicSalonProfile.create({
          data: {
            businessId: business.id,
            slug: uniqueSlug,
            isListed: true,
            specialties: [],
            amenities: [],
            galleryImages: [],
          },
        });
      }

      // Create new user linked to existing business with seeded data
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role: "OWNER",
          businessId: business.id,
        },
        include: { business: true },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        businessId: user.businessId,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "90d" }
    );

    return NextResponse.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        phone: null,
        image: null,
        role: user.role,
        businessId: user.businessId,
        staffId: null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Mobile auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
