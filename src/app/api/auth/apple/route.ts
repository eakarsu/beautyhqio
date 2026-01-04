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
    const {
      identityToken,
      authorizationCode,
      nonce,
      userIdentifier,
      email,
      firstName,
      lastName,
    } = body;

    // Validate required fields
    if (!identityToken || !userIdentifier) {
      return NextResponse.json(
        { error: "Identity token and user identifier are required" },
        { status: 400 }
      );
    }

    // In production, you would verify the identityToken with Apple's servers
    // For now, we trust the token from the iOS app

    // Find or create user by Apple userIdentifier
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || "" },
          // You could store appleUserIdentifier in a separate field
        ]
      },
      include: { business: true },
    });

    if (!user && email) {
      // Check if email exists
      user = await prisma.user.findUnique({
        where: { email },
        include: { business: true },
      });
    }

    if (!user) {
      // Create new user
      // Get existing business or create new one
      let business = await prisma.business.findFirst({
        orderBy: { createdAt: "asc" },
      });

      if (!business) {
        const businessName = firstName ? `${firstName}'s Business` : "My Business";
        business = await prisma.business.create({
          data: {
            name: businessName,
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

      // Create user with Apple account
      // Note: Apple only provides email on first sign-in
      const userEmail = email || `apple_${userIdentifier.substring(0, 8)}@private.appleid.com`;

      user = await prisma.user.create({
        data: {
          email: userEmail,
          firstName: firstName || "Apple",
          lastName: lastName || "User",
          role: "OWNER",
          businessId: business.id,
        },
        include: { business: true },
      });
    }

    // Generate JWT tokens
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
        phone: user.phone,
        image: user.image,
        role: user.role,
        businessId: user.businessId,
        staffId: null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Apple auth error:", error);

    // Handle unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Apple authentication failed" },
      { status: 500 }
    );
  }
}
