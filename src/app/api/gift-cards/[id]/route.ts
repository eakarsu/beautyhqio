import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/gift-cards/[id] - Get gift card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const giftCard = await prisma.giftCard.findUnique({
      where: { id },
      include: {
        purchasedBy: true,
        owner: true,
        usageHistory: {
          orderBy: { usedAt: "desc" },
        },
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
    console.error("Error fetching gift card:", error);
    return NextResponse.json(
      { error: "Failed to fetch gift card" },
      { status: 500 }
    );
  }
}

// PUT /api/gift-cards/[id] - Update gift card
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const giftCard = await prisma.giftCard.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(giftCard);
  } catch (error) {
    console.error("Error updating gift card:", error);
    return NextResponse.json(
      { error: "Failed to update gift card" },
      { status: 500 }
    );
  }
}

// DELETE /api/gift-cards/[id] - Delete gift card
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete usage history first
    await prisma.giftCardUsage.deleteMany({ where: { giftCardId: id } });

    // Delete the gift card
    await prisma.giftCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gift card:", error);
    return NextResponse.json(
      { error: "Failed to delete gift card" },
      { status: 500 }
    );
  }
}
