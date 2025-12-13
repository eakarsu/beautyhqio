import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/loyalty/earn - Award points
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, points, description, type = "earn" } = body;

    // Get or create loyalty account
    let account = await prisma.loyaltyAccount.findUnique({
      where: { clientId },
    });

    if (!account) {
      // Find the program
      const program = await prisma.loyaltyProgram.findFirst();
      if (!program) {
        return NextResponse.json(
          { error: "No loyalty program found" },
          { status: 404 }
        );
      }

      account = await prisma.loyaltyAccount.create({
        data: {
          clientId,
          programId: program.id,
          pointsBalance: 0,
          lifetimePoints: 0,
        },
      });
    }

    // Update points
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { clientId },
      data: {
        pointsBalance: { increment: points },
        lifetimePoints: { increment: points > 0 ? points : 0 },
      },
    });

    // Create transaction
    await prisma.loyaltyTransaction.create({
      data: {
        accountId: updatedAccount.id,
        type,
        points,
        description,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        clientId,
        type: "LOYALTY_EARNED",
        title: `Earned ${points} points`,
        description,
        metadata: { points },
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("Error earning points:", error);
    return NextResponse.json(
      { error: "Failed to earn points" },
      { status: 500 }
    );
  }
}
