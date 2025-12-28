import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// Helper to get user from either web session or mobile JWT
async function getAuthenticatedUser(request: NextRequest) {
  // First try web session (NextAuth)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });
    return user;
  }

  // If no web session, try mobile JWT token
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; businessId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { business: true },
      });
      return user;
    } catch {
      return null;
    }
  }

  return null;
}

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
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user?.businessId) {
      return NextResponse.json(
        { error: "Unauthorized or no business associated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
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
        businessId: user.businessId,
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
  } catch (error: any) {
    console.error("Error creating gift card:", error);

    // Handle unique constraint error (duplicate code)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A gift card with this code already exists. Please try again." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create gift card" },
      { status: 500 }
    );
  }
}
