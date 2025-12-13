import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/gift-cards/check-balance?code=XXX - Check gift card balance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    const giftCard = await prisma.giftCard.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        initialBalance: true,
        currentBalance: true,
        status: true,
        recipientName: true,
        recipientEmail: true,
        expiresAt: true,
        purchasedAt: true,
      },
    });

    if (!giftCard) {
      return NextResponse.json(
        { error: "Gift card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(giftCard);
  } catch (error) {
    console.error("Error checking balance:", error);
    return NextResponse.json(
      { error: "Failed to check balance" },
      { status: 500 }
    );
  }
}
