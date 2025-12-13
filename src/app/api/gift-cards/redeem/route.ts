import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/gift-cards/redeem - Redeem gift card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, amount, clientId } = body;

    // Find gift card by code
    const giftCard = await prisma.giftCard.findUnique({
      where: { code },
    });

    if (!giftCard) {
      return NextResponse.json(
        { error: "Gift card not found" },
        { status: 404 }
      );
    }

    if (giftCard.status !== "active") {
      return NextResponse.json(
        { error: "Gift card is not active" },
        { status: 400 }
      );
    }

    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      return NextResponse.json(
        { error: "Gift card has expired" },
        { status: 400 }
      );
    }

    const balance = Number(giftCard.currentBalance);
    if (balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance", available: balance },
        { status: 400 }
      );
    }

    const newBalance = balance - amount;

    // Update gift card
    const updatedCard = await prisma.giftCard.update({
      where: { code },
      data: {
        currentBalance: newBalance,
        status: newBalance === 0 ? "redeemed" : "active",
      },
    });

    // Create usage record
    await prisma.giftCardUsage.create({
      data: {
        giftCardId: giftCard.id,
        amount,
        balanceAfter: newBalance,
      },
    });

    // Create activity if client
    if (clientId) {
      await prisma.activity.create({
        data: {
          clientId,
          type: "GIFT_CARD_REDEEMED",
          title: `Redeemed $${amount} from gift card`,
          description: `Remaining balance: $${newBalance}`,
          metadata: { giftCardId: giftCard.id, amount, newBalance },
        },
      });
    }

    return NextResponse.json({
      success: true,
      amountRedeemed: amount,
      remainingBalance: newBalance,
    });
  } catch (error) {
    console.error("Error redeeming gift card:", error);
    return NextResponse.json(
      { error: "Failed to redeem gift card" },
      { status: 500 }
    );
  }
}
