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
      firstName: firstNameFromBody,
      lastName: lastNameFromBody,
      name,  // iOS sends single "name" field
      phone,
      businessName,
      businessType,
    } = body;

    // Handle iOS format (name) vs web format (firstName/lastName)
    let firstName = firstNameFromBody;
    let lastName = lastNameFromBody;
    if (!firstName && !lastName && name) {
      const nameParts = name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Validate required fields
    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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

    // If still no business, return error
    if (!business) {
      return NextResponse.json(
        { error: "No business found. Please run database seed first." },
        { status: 400 }
      );
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
        email: normalizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: "OWNER",
        businessId: business.id,
      },
    });

    // Generate JWT token (same as login)
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

    // Return same format as login endpoint
    return NextResponse.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        phone: user.phone || null,
        image: user.avatar || null,
        role: user.role,
        businessId: user.businessId,
        staffId: null,
        isClient: false,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    }, { status: 201 });
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
