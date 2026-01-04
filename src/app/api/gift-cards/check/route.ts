import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const giftCard = await prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        code: true,
        currentBalance: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!giftCard) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
    }

    if (giftCard.status !== "ACTIVE") {
      return NextResponse.json({ error: "Gift card is not active" }, { status: 400 });
    }

    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Gift card has expired" }, { status: 400 });
    }

    return NextResponse.json({
      id: giftCard.id,
      code: giftCard.code,
      currentBalance: Number(giftCard.currentBalance),
      status: giftCard.status,
    });
  } catch (error) {
    console.error("Error checking gift card:", error);
    return NextResponse.json(
      { error: "Failed to check gift card" },
      { status: 500 }
    );
  }
}
