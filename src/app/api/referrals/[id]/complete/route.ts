import { NextRequest } from "next/server";
import { z } from "zod";
import { context, endpoint, fail } from "@/lib/operations/core";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;
const bodySchema = z.object({
  rewardReferrer: z.boolean().default(true),
  rewardReferred: z.boolean().default(true),
});

// POST /api/referrals/[id]/complete - Complete a referral and award rewards.
//
// Staff action scoped to the caller's business. There is no public referral
// token on the model, so completion requires an authenticated staff session and
// the referral's referrer must belong to that business.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { id } = await params;
    const { rewardReferrer, rewardReferred } = bodySchema.parse(
      await request.json().catch(() => ({}))
    );

    // Scope through the referrer: a referral in another business is not found.
    const referral = await prisma.referral.findFirst({
      where: { id, referrer: { businessId: ctx.businessId } },
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

    if (!referral) return fail(404, "Referral not found");

    if (referral.status === "completed") {
      return fail(400, "Referral has already been completed");
    }

    // Loyalty program is unique per business.
    const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
      where: { isActive: true, businessId: ctx.businessId },
    });

    const updates: Promise<unknown>[] = [];

    // Award referrer
    if (rewardReferrer && !referral.referrerRewarded) {
      if (loyaltyProgram && referral.referrer.loyaltyAccount) {
        updates.push(
          prisma.loyaltyAccount.update({
            where: { id: referral.referrer.loyaltyAccount.id },
            data: {
              pointsBalance: { increment: loyaltyProgram.bonusOnReferral },
              lifetimePoints: { increment: loyaltyProgram.bonusOnReferral },
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
      if (loyaltyProgram && referral.referred.loyaltyAccount) {
        updates.push(
          prisma.loyaltyAccount.update({
            where: { id: referral.referred.loyaltyAccount.id },
            data: {
              pointsBalance: { increment: Math.floor(loyaltyProgram.bonusOnReferral / 2) },
              lifetimePoints: { increment: Math.floor(loyaltyProgram.bonusOnReferral / 2) },
            },
          })
        );
      }

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
        where: { id: referral.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          referrerRewarded: rewardReferrer,
          referredRewarded: rewardReferred,
        },
      })
    );

    await Promise.all(updates);

    const updatedReferral = await prisma.referral.findUnique({
      where: { id: referral.id },
      include: {
        referrer: { select: { firstName: true, lastName: true } },
        referred: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      success: true,
      referral: updatedReferral,
      rewards: {
        referrerRewarded: rewardReferrer,
        referredRewarded: rewardReferred,
        bonusPoints: loyaltyProgram?.bonusOnReferral || 0,
      },
    };
  });
}
