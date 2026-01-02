import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/referrals - List referrals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referrerId = searchParams.get("referrerId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};

    if (referrerId) {
      where.referrerId = referrerId;
    }

    if (status) {
      where.status = status;
    }

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
      _count: true,
    });

    return NextResponse.json({
      referrals,
      stats: {
        total: referrals.length,
        byStatus: stats.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count }),
          {}
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

// POST /api/referrals - Create a new referral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      referrerId,
      referredFirstName,
      referredLastName,
      referredEmail,
      referredPhone,
      referrerReward,
      referredReward,
    } = body;

    if (!referrerId || !referredPhone) {
      return NextResponse.json(
        { error: "referrerId and referredPhone are required" },
        { status: 400 }
      );
    }

    // Check if referrer exists
    const referrer = await prisma.client.findUnique({
      where: { id: referrerId },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Referrer not found" },
        { status: 404 }
      );
    }

    // Check if referred person is already a client in the same business
    const existingClient = await prisma.client.findFirst({
      where: {
        businessId: referrer.businessId,
        OR: [
          { phone: referredPhone },
          ...(referredEmail ? [{ email: referredEmail }] : []),
        ],
      },
    });

    if (existingClient) {
      // Check if already referred
      const existingReferral = await prisma.referral.findUnique({
        where: { referredId: existingClient.id },
      });

      if (existingReferral) {
        return NextResponse.json(
          { error: "This person has already been referred" },
          { status: 400 }
        );
      }
    }

    // Create the referred client if they don't exist
    let referredClient = existingClient;
    if (!referredClient) {
      referredClient = await prisma.client.create({
        data: {
          firstName: referredFirstName || "Referred",
          lastName: referredLastName || "Client",
          email: referredEmail,
          phone: referredPhone,
          referralSource: "referral",
          referredById: referrerId,
          businessId: referrer.businessId,
        },
      });
    }

    // Create the referral
    const referral = await prisma.referral.create({
      data: {
        referrerId,
        referredId: referredClient.id,
        referrerReward: referrerReward || "10% off next service",
        referredReward: referredReward || "15% off first visit",
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
        clientId: referrerId,
        type: "REFERRAL_MADE",
        title: "Made a referral",
        description: `Referred ${referredClient.firstName} ${referredClient.lastName}`,
        metadata: {
          referralId: referral.id,
          referredId: referredClient.id,
        },
      },
    });

    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    console.error("Error creating referral:", error);
    return NextResponse.json(
      { error: "Failed to create referral" },
      { status: 500 }
    );
  }
}
