import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "beautyhq-secret-key";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identityToken, authorizationCode, email, fullName } = body;

    if (!identityToken) {
      return NextResponse.json(
        { error: "Identity token is required" },
        { status: 400 }
      );
    }

    // Decode Apple identity token to get user info
    const tokenParts = identityToken.split(".");
    if (tokenParts.length !== 3) {
      return NextResponse.json(
        { error: "Invalid identity token format" },
        { status: 400 }
      );
    }

    let applePayload: any;
    try {
      const payload = Buffer.from(tokenParts[1], "base64").toString("utf8");
      applePayload = JSON.parse(payload);
    } catch {
      return NextResponse.json(
        { error: "Failed to decode identity token" },
        { status: 400 }
      );
    }

    const appleUserId = applePayload.sub;
    const appleEmail = email || applePayload.email;

    if (!appleUserId) {
      return NextResponse.json(
        { error: "Could not extract user ID from token" },
        { status: 400 }
      );
    }

    // Check if user exists by Apple ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { appleId: appleUserId },
          ...(appleEmail ? [{ email: appleEmail }] : []),
        ],
      },
      include: { business: true },
    });

    if (!user) {
      // Get or create business
      let business = await prisma.business.findFirst({
        orderBy: { createdAt: "asc" },
      });

      if (!business) {
        business = await prisma.business.create({
          data: {
            name: "My Salon",
            type: "MULTI_SERVICE",
            timezone: "America/New_York",
            defaultLanguage: "en",
            supportedLanguages: ["en"],
          },
        });

        // Create subscription
        await prisma.businessSubscription.create({
          data: {
            businessId: business.id,
            plan: "STARTER",
            status: "ACTIVE",
            monthlyPrice: 0,
            marketplaceCommissionPct: 20,
          },
        });

        // Create public profile
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

      // Create new user
      const firstName = fullName?.givenName || "User";
      const lastName = fullName?.familyName || "";

      user = await prisma.user.create({
        data: {
          email: appleEmail || `apple_${appleUserId}@beautyhq.app`,
          firstName,
          lastName,
          role: "OWNER",
          businessId: business.id,
          appleId: appleUserId,
        },
        include: { business: true },
      });
    } else if (!user.appleId) {
      // Link Apple ID to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { appleId: appleUserId },
        include: { business: true },
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        businessId: user.businessId,
        businessName: user.business?.name,
      },
    });
  } catch (error) {
    console.error("Apple sign in error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Apple" },
      { status: 500 }
    );
  }
}
