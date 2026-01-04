import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
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
      email,
      password,
      firstName: providedFirstName,
      lastName: providedLastName,
      name, // Support single name field from mobile apps
      phone,
      businessName,
      businessType,
    } = body;

    // Handle name field - support both "name" and "firstName/lastName"
    let firstName = providedFirstName;
    let lastName = providedLastName;

    if (!firstName && name) {
      // Split single name field into first and last
      const nameParts = name.trim().split(" ");
      firstName = nameParts[0] || name;
      lastName = nameParts.slice(1).join(" ") || "";
    }

    // Validate required fields
    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get existing business (demo data) or create new one
    let business = await prisma.business.findFirst({
      orderBy: { createdAt: "asc" },
    });

    let isNewBusiness = false;

    // If no business exists and businessName provided, create one
    if (!business && businessName) {
      business = await prisma.business.create({
        data: {
          name: businessName,
          type: businessType || "MULTI_SERVICE",
          timezone: "America/New_York",
          defaultLanguage: "en",
          supportedLanguages: ["en"],
        },
      });
      isNewBusiness = true;
    }

    // If still no business, create a default one
    if (!business) {
      business = await prisma.business.create({
        data: {
          name: businessName || `${firstName}'s Business`,
          type: businessType || "MULTI_SERVICE",
          timezone: "America/New_York",
          defaultLanguage: "en",
          supportedLanguages: ["en"],
        },
      });
      isNewBusiness = true;
    }

    // Create BusinessSubscription if it doesn't exist (STARTER plan - free, 20% commission)
    const existingSubscription = await prisma.businessSubscription.findUnique({
      where: { businessId: business.id },
    });

    if (!existingSubscription) {
      await prisma.businessSubscription.create({
        data: {
          businessId: business.id,
          plan: "STARTER",
          status: "ACTIVE",
          monthlyPrice: 0,
          marketplaceCommissionPct: 20,
        },
      });
    }

    // Create PublicSalonProfile if it doesn't exist
    const existingProfile = await prisma.publicSalonProfile.findUnique({
      where: { businessId: business.id },
    });

    if (!existingProfile) {
      // Generate unique slug
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

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName: lastName || "",
        phone: phone || null,
        role: "OWNER",
        businessId: business.id,
      },
    });

    // Generate JWT tokens for auto-login after registration
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

    // Return response compatible with mobile app AuthResponse
    return NextResponse.json(
      {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          phone: user.phone,
          image: null,
          role: user.role,
          businessId: user.businessId,
          staffId: null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error registering user:", error);

    // Handle unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
