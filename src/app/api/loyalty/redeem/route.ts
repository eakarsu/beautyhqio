import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/loyalty/redeem - Redeem reward
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, rewardId } = body;

    // Get reward
    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      return NextResponse.json(
        { error: "Reward not found" },
        { status: 404 }
      );
    }

    // Get account
    const account = await prisma.loyaltyAccount.findUnique({
      where: { clientId },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Loyalty account not found" },
        { status: 404 }
      );
    }

    // Check if enough points
    if (account.pointsBalance < reward.pointsCost) {
      return NextResponse.json(
        { error: "Insufficient points" },
        { status: 400 }
      );
    }

    // Deduct points
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { clientId },
      data: {
        pointsBalance: { decrement: reward.pointsCost },
      },
    });

    // Create transaction
    await prisma.loyaltyTransaction.create({
      data: {
        accountId: updatedAccount.id,
        type: "redeem",
        points: -reward.pointsCost,
        description: `Redeemed: ${reward.name}`,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        clientId,
        type: "LOYALTY_REDEEMED",
        title: `Redeemed ${reward.name}`,
        description: `Used ${reward.pointsCost} points`,
        metadata: { rewardId, pointsCost: reward.pointsCost },
      },
    });

    return NextResponse.json({
      success: true,
      reward,
      remainingPoints: updatedAccount.pointsBalance,
    });
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return NextResponse.json(
      { error: "Failed to redeem reward" },
      { status: 500 }
    );
  }
}
