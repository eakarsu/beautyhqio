import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/loyalty/account/[clientId] - Get loyalty account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;

    const account = await prisma.loyaltyAccount.findUnique({
      where: { clientId },
      include: {
        client: true,
        program: {
          include: {
            rewards: true,
          },
        },
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Loyalty account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching loyalty account:", error);
    return NextResponse.json(
      { error: "Failed to fetch loyalty account" },
      { status: 500 }
    );
  }
}
