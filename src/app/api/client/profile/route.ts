import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/client/profile - Get client profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        client: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || user.client?.phone || "",
        birthday: user.client?.birthday?.toISOString().split("T")[0] || "",
        avatar: user.avatar,
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
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, birthday } = body;

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
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
        where: { userId: session.user.id },
        update: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || "",
          birthday: birthdayDate,
          birthdayMonth: birthdayDate.getMonth() + 1,
          birthdayDay: birthdayDate.getDate(),
        },
        create: {
          userId: session.user.id,
          firstName: firstName || session.user.firstName,
          lastName: lastName || session.user.lastName,
          email: session.user.email,
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
