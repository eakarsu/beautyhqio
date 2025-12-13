import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/referrals/[id]/complete - Complete a referral and award rewards
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rewardReferrer = true, rewardReferred = true } = body;

    // Get the referral
    const referral = await prisma.referral.findUnique({
      where: { id },
      include: {
        referrer: {
          include: {
            loyaltyAccount: true,
          },
        },
        referred: {
          include: {
            loyaltyAccount: true,
          },
        },
      },
    });

    if (!referral) {
      return NextResponse.json(
        { error: "Referral not found" },
        { status: 404 }
      );
    }

    if (referral.status === "completed") {
      return NextResponse.json(
        { error: "Referral has already been completed" },
        { status: 400 }
      );
    }

    // Get loyalty program for bonus points
    const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
      where: { isActive: true },
    });

    const updates: Promise<unknown>[] = [];

    // Award referrer
    if (rewardReferrer && !referral.referrerRewarded) {
      // Add loyalty points if program exists
      if (loyaltyProgram && referral.referrer.loyaltyAccount) {
        updates.push(
          prisma.loyaltyAccount.update({
            where: { id: referral.referrer.loyaltyAccount.id },
            data: {
              pointsBalance: {
                increment: loyaltyProgram.bonusOnReferral,
              },
              lifetimePoints: {
                increment: loyaltyProgram.bonusOnReferral,
              },
            },
          })
        );

        updates.push(
          prisma.loyaltyTransaction.create({
            data: {
              accountId: referral.referrer.loyaltyAccount.id,
              type: "referral_bonus",
              points: loyaltyProgram.bonusOnReferral,
              description: `Referral bonus for ${referral.referred.firstName}`,
            },
          })
        );
      }

      // Create activity
      updates.push(
        prisma.activity.create({
          data: {
            clientId: referral.referrerId,
            type: "LOYALTY_EARNED",
            title: "Referral reward earned",
            description: `${referral.referrerReward} - Thank you for referring ${referral.referred.firstName}!`,
            metadata: { referralId: id },
          },
        })
      );
    }

    // Award referred
    if (rewardReferred && !referral.referredRewarded) {
      // Add loyalty points if program exists
      if (loyaltyProgram && referral.referred.loyaltyAccount) {
        updates.push(
          prisma.loyaltyAccount.update({
            where: { id: referral.referred.loyaltyAccount.id },
            data: {
              pointsBalance: {
                increment: Math.floor(loyaltyProgram.bonusOnReferral / 2),
              },
              lifetimePoints: {
                increment: Math.floor(loyaltyProgram.bonusOnReferral / 2),
              },
            },
          })
        );
      }

      // Create activity
      updates.push(
        prisma.activity.create({
          data: {
            clientId: referral.referredId,
            type: "LOYALTY_EARNED",
            title: "Welcome reward",
            description: `${referral.referredReward} - Welcome to our salon!`,
            metadata: { referralId: id },
          },
        })
      );
    }

    // Update referral status
    updates.push(
      prisma.referral.update({
        where: { id },
        data: {
          status: "completed",
          completedAt: new Date(),
          referrerRewarded: rewardReferrer,
          referredRewarded: rewardReferred,
        },
      })
    );

    await Promise.all(updates);

    // Get updated referral
    const updatedReferral = await prisma.referral.findUnique({
      where: { id },
      include: {
        referrer: {
          select: { firstName: true, lastName: true },
        },
        referred: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      referral: updatedReferral,
      rewards: {
        referrerRewarded: rewardReferrer,
        referredRewarded: rewardReferred,
        bonusPoints: loyaltyProgram?.bonusOnReferral || 0,
      },
    });
  } catch (error) {
    console.error("Error completing referral:", error);
    return NextResponse.json(
      { error: "Failed to complete referral" },
      { status: 500 }
    );
  }
}
