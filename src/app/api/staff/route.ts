import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, getBusinessIdFilter, AuthenticatedUser } from "@/lib/api-auth";

// GET /api/staff - List staff
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const isActive = searchParams.get("isActive");
    const requestedBusinessId = searchParams.get("businessId");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (locationId) where.locationId = locationId;
    if (isActive !== null) where.isActive = isActive === "true";

    // Apply business filter - filter staff by their location's businessId
    const businessIdFilter = getBusinessIdFilter(user as AuthenticatedUser, requestedBusinessId);
    if (businessIdFilter) {
      where.location = {
        businessId: businessIdFilter,
      };
    }

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
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER, MANAGER, or PLATFORM_ADMIN can create staff
    if (!user.isPlatformAdmin && !["OWNER", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden - insufficient permissions" }, { status: 403 });
    }

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

    // Determine the target business
    const targetBusinessId = user.isPlatformAdmin ? body.businessId || user.businessId : user.businessId;
    if (!targetBusinessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // If no userId provided, find existing user or create a new one
    if (!finalUserId && email && firstName && lastName) {
      // First check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        finalUserId = existingUser.id;
      } else {
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
            businessId: targetBusinessId,
          },
        });
        finalUserId = newUser.id;
      }
    }

    // If still no userId, return error
    if (!finalUserId) {
      return NextResponse.json(
        { error: "User ID or user details (email, firstName, lastName) required" },
        { status: 400 }
      );
    }

    // If no locationId provided, get the first location for this business
    if (!finalLocationId) {
      const businessLocation = await prisma.location.findFirst({
        where: { businessId: targetBusinessId },
      });
      finalLocationId = businessLocation?.id || null;
    } else {
      // Verify the location belongs to the user's business
      const location = await prisma.location.findUnique({
        where: { id: finalLocationId },
      });
      if (!user.isPlatformAdmin && location?.businessId !== targetBusinessId) {
        return NextResponse.json({ error: "Location does not belong to your business" }, { status: 403 });
      }
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
