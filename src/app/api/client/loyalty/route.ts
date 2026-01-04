import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/client/loyalty - Get client's loyalty account
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find client profile
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email },
        ],
      },
      include: {
        loyaltyAccount: true,
      },
    });

    if (!client?.loyaltyAccount) {
      // Return default account if not enrolled
      return NextResponse.json({
        account: {
          pointsBalance: 0,
          lifetimePoints: 0,
          tier: "Bronze",
        },
      });
    }

    return NextResponse.json({
      account: {
        pointsBalance: client.loyaltyAccount.pointsBalance,
        lifetimePoints: client.loyaltyAccount.lifetimePoints,
        tier: client.loyaltyAccount.tier,
      },
    });
  } catch (error) {
    console.error("Error fetching loyalty account:", error);
    return NextResponse.json(
      { error: "Failed to fetch loyalty account" },
      { status: 500 }
    );
  }
}
