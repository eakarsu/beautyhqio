import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/client/rewards - Get available rewards
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active rewards from all businesses
    // In a real app, you'd filter by the businesses the client has visited
    const rewards = await prisma.loyaltyReward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: "asc" },
      take: 20,
    });

    return NextResponse.json({
      rewards: rewards.map((reward) => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        pointsCost: reward.pointsCost,
        image: reward.image,
      })),
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}
