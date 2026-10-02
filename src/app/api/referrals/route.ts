import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const referralInput = z.object({
  referrerId: z.string().trim().min(1).max(191),
  referredFirstName: z.string().trim().max(100).optional(),
  referredLastName: z.string().trim().max(100).optional(),
  referredEmail: z
    .union([z.string().email().max(200), z.literal("")])
    .optional()
    .nullable(),
  referredPhone: z.string().trim().min(7).max(30),
  referrerReward: z.string().trim().max(200).optional(),
  referredReward: z.string().trim().max(200).optional(),
});

// GET /api/referrals - List referrals for the caller's business
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const referrerId = searchParams.get("referrerId");
    const status = searchParams.get("status");
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50)
    );

    const where: Record<string, unknown> = {
      referrer: { businessId: ctx.businessId },
    };
    if (referrerId) where.referrerId = referrerId;
    if (status) where.status = status;

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        referrer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        referred: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get stats
    const stats = await prisma.referral.groupBy({
      by: ["status"],
      where: { referrer: { businessId: ctx.businessId } },
      _count: true,
    });

    return {
      referrals,
      stats: {
        total: referrals.length,
        byStatus: stats.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count }),
          {}
        ),
      },
    };
  });
}

// POST /api/referrals - Create a new referral
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([
      "OWNER",
      "MANAGER",
      "RECEPTIONIST",
      "STAFF",
      "CLIENT",
    ]);
    const input = referralInput.parse(await request.json());

    // A signed-in client may only refer on their own behalf.
    if (ctx.user.role === "CLIENT" && input.referrerId !== ctx.user.clientId) {
      return fail(403, "You can only create referrals for your own account");
    }

    // Check the referrer exists in the caller's business.
    const referrer = await prisma.client.findFirst({
      where: { id: input.referrerId, businessId: ctx.businessId },
    });
    if (!referrer) return fail(404, "Referrer not found");

    // Check if the referred person is already a client in the same business.
    const existingClient = await prisma.client.findFirst({
      where: {
        businessId: referrer.businessId,
        OR: [
          { phone: input.referredPhone },
          ...(input.referredEmail ? [{ email: input.referredEmail }] : []),
        ],
      },
    });

    if (existingClient) {
      // Check if already referred
      const existingReferral = await prisma.referral.findUnique({
        where: { referredId: existingClient.id },
      });

      if (existingReferral) {
        return fail(400, "This person has already been referred");
      }
    }

    // Create the referred client if they don't exist
    let referredClient = existingClient;
    if (!referredClient) {
      referredClient = await prisma.client.create({
        data: {
          firstName: input.referredFirstName || "Referred",
          lastName: input.referredLastName || "Client",
          email: input.referredEmail || null,
          phone: input.referredPhone,
          referralSource: "referral",
          referredById: input.referrerId,
          businessId: referrer.businessId,
        },
      });
    }

    // Create the referral
    const referral = await prisma.referral.create({
      data: {
        referrerId: input.referrerId,
        referredId: referredClient.id,
        referrerReward: input.referrerReward || "10% off next service",
        referredReward: input.referredReward || "15% off first visit",
        status: "pending",
      },
      include: {
        referrer: {
          select: { firstName: true, lastName: true },
        },
        referred: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Create activity for referrer
    await prisma.activity.create({
      data: {
        clientId: input.referrerId,
        type: "REFERRAL_MADE",
        title: "Made a referral",
        description: `Referred ${referredClient.firstName} ${referredClient.lastName}`,
        metadata: {
          referralId: referral.id,
          referredId: referredClient.id,
        },
      },
    });

    return referral;
  });
}
