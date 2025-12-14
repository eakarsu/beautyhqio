import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/staff - List staff
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (locationId) where.locationId = locationId;
    if (isActive !== null) where.isActive = isActive === "true";

    const staff = await prisma.staff.findMany({
      where,
      include: {
        user: true,
        location: true,
        schedules: true,
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      locationId,
      displayName,
      title,
      bio,
      color,
      specialties,
      employmentType,
      payType,
      commissionPct,
      // For creating a new user if userId not provided
      email,
      firstName,
      lastName,
      phone,
    } = body;

    let finalUserId = userId;
    let finalLocationId = locationId;

    // If no userId provided, find existing user or create a new one
    if (!finalUserId && email && firstName && lastName) {
      // First check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        finalUserId = existingUser.id;
      } else {
        // Get the first business for the new user
        const firstBusiness = await prisma.business.findFirst();

        // Generate a temporary password (should be changed on first login)
        const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const newUser = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            phone: phone || null,
            password: tempPassword, // Temporary password - user should reset on first login
            role: "STAFF",
            businessId: firstBusiness?.id ?? "",
          },
        });
        finalUserId = newUser.id;
      }
    }

    // If still no userId, get the first user
    if (!finalUserId) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json(
          { error: "No user found. Please provide user details." },
          { status: 400 }
        );
      }
      finalUserId = firstUser.id;
    }

    // If no locationId provided, get the first location
    if (!finalLocationId) {
      const firstLocation = await prisma.location.findFirst();
      finalLocationId = firstLocation?.id || null;
    }

    // Check if staff already exists for this user
    const existingStaff = await prisma.staff.findUnique({
      where: { userId: finalUserId },
      include: { user: true, location: true },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "A staff member already exists for this user." },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.create({
      data: {
        userId: finalUserId,
        locationId: finalLocationId,
        displayName,
        title,
        bio,
        color,
        specialties: specialties || [],
        employmentType,
        payType,
        commissionPct,
      },
      include: {
        user: true,
        location: true,
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error: any) {
    console.error("Error creating staff:", error);

    // Handle unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A staff member with this email already exists." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create staff" },
      { status: 500 }
    );
  }
}
