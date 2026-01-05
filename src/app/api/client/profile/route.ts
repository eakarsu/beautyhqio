import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

// GET /api/client/profile - Get client profile
export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        client: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || user.client?.phone || null,
        birthday: user.client?.birthday?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/client/profile - Update client profile
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, birthday } = body;

    // Update user
    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
      },
    });

    // Update or create client profile if birthday provided
    if (birthday) {
      const birthdayDate = new Date(birthday);

      await prisma.client.upsert({
        where: { userId: authUser.id },
        update: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || "",
          birthday: birthdayDate,
          birthdayMonth: birthdayDate.getMonth() + 1,
          birthdayDay: birthdayDate.getDate(),
        },
        create: {
          userId: authUser.id,
          firstName: firstName || authUser.firstName,
          lastName: lastName || authUser.lastName,
          email: authUser.email,
          phone: phone || "0000000000",
          birthday: birthdayDate,
          birthdayMonth: birthdayDate.getMonth() + 1,
          birthdayDay: birthdayDate.getDate(),
          businessId: "", // Will need a default business or make optional
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
