import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/memberships/[id]/subscribe - Subscribe a client to membership
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientId, paymentMethod, stripeSubscriptionId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    // Get the membership
    const membership = await prisma.membership.findUnique({
      where: { id },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    if (!membership.isActive) {
      return NextResponse.json(
        { error: "Membership is no longer available" },
        { status: 400 }
      );
    }

    // Check for existing active subscription
    const existingSubscription = await prisma.membershipSubscription.findFirst({
      where: {
        clientId,
        membershipId: id,
        status: "active",
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "Client already has an active subscription to this membership" },
        { status: 400 }
      );
    }

    // Calculate next billing date
    const nextBillingDate = new Date();
    switch (membership.billingCycle) {
      case "monthly":
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        break;
      case "quarterly":
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
        break;
      case "yearly":
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        break;
    }

    // Create the subscription
    const subscription = await prisma.membershipSubscription.create({
      data: {
        membershipId: id,
        clientId,
        nextBillingDate,
        lastPaymentDate: new Date(),
        lastPaymentAmount: membership.price,
        paymentMethod,
        stripeSubscriptionId,
      },
      include: {
        membership: true,
      },
    });

    // Create activity for client
    await prisma.activity.create({
      data: {
        clientId,
        type: "PURCHASE",
        title: `Subscribed to ${membership.name}`,
        description: `${membership.billingCycle} membership - ${membership.discountPercent}% discount on services`,
        metadata: {
          subscriptionId: subscription.id,
          membershipId: id,
          membershipName: membership.name,
        },
      },
    });

    return NextResponse.json(
      {
        ...subscription,
        lastPaymentAmount: subscription.lastPaymentAmount
          ? Number(subscription.lastPaymentAmount)
          : null,
        membership: {
          ...subscription.membership,
          price: Number(subscription.membership.price),
          discountPercent: Number(subscription.membership.discountPercent),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error subscribing to membership:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to membership" },
      { status: 500 }
    );
  }
}
