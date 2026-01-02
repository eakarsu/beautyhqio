import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

// GET /api/admin/subscriptions - List all subscriptions
export async function GET() {
  try {
    const authResult = await requireRoles(["PLATFORM_ADMIN"]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const subscriptions = await prisma.businessSubscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        plan: sub.plan,
        status: sub.status,
        monthlyPrice: sub.monthlyPrice,
        billingCycle: sub.billingCycle,
        trialEndsAt: sub.trialEndsAt?.toISOString() || null,
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || null,
        business: sub.business,
      })),
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
