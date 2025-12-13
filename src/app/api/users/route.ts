import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    // Get the first business if no businessId is provided
    let finalBusinessId: string | null | undefined = businessId;
    if (!finalBusinessId) {
      const business = await prisma.business.findFirst();
      finalBusinessId = business?.id;
    }

    if (!finalBusinessId) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: { businessId: finalBusinessId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: "asc" },
        { firstName: "asc" },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the first business
    const business = await prisma.business.findFirst();
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password || "temp123", // Should be hashed in production
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone || null,
        role: body.role || "STAFF",
        isActive: body.isActive ?? true,
        businessId: business.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
