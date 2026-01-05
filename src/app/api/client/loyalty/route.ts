import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

// GET /api/client/loyalty - Get client's loyalty account
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find client profile
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: user.email },
        ],
      },
      include: {
        loyaltyAccount: true,
      },
    });

    if (!client?.loyaltyAccount) {
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
