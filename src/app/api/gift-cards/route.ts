import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "GC-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/gift-cards - List gift cards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status");
    const code = searchParams.get("code");

    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (status) where.status = status;
    if (code) where.code = code;

    const giftCards = await prisma.giftCard.findMany({
      where,
      include: {
        purchasedBy: true,
        owner: true,
        usageHistory: {
          orderBy: { usedAt: "desc" },
        },
      },
      orderBy: { purchasedAt: "desc" },
    });

    return NextResponse.json(giftCards);
  } catch (error) {
    console.error("Error fetching gift cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch gift cards" },
      { status: 500 }
    );
  }
}

// POST /api/gift-cards - Create gift card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      amount,
      purchasedById,
      recipientEmail,
      recipientName,
      message,
      isDigital = true,
    } = body;

    const code = generateGiftCardCode();

    const giftCard = await prisma.giftCard.create({
      data: {
        businessId,
        code,
        initialBalance: amount,
        currentBalance: amount,
        purchasedById,
        recipientEmail,
        recipientName,
        message,
        isDigital,
      },
      include: {
        purchasedBy: true,
      },
    });

    // Create activity if purchased by client
    if (purchasedById) {
      await prisma.activity.create({
        data: {
          clientId: purchasedById,
          type: "GIFT_CARD_PURCHASED",
          title: `Purchased $${amount} gift card`,
          description: `Gift card code: ${code}`,
          metadata: { giftCardId: giftCard.id, amount },
        },
      });
    }

    return NextResponse.json(giftCard, { status: 201 });
  } catch (error) {
    console.error("Error creating gift card:", error);
    return NextResponse.json(
      { error: "Failed to create gift card" },
      { status: 500 }
    );
  }
}
