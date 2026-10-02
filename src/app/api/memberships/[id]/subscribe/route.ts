import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const subscribeSchema = z.object({
  clientId: idSchema,
  paymentMethod: z.string().trim().max(40).optional().nullable(),
  stripeSubscriptionId: z.string().trim().max(200).optional().nullable(),
});

// POST /api/memberships/[id]/subscribe - Subscribe a client to membership
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "CLIENT"]);
    const { id } = await params;
    const input = subscribeSchema.parse(await request.json());

    // A signed-in client may only subscribe their own profile.
    if (ctx.user.role === "CLIENT" && input.clientId !== ctx.user.clientId) {
      return fail(403, "You can only subscribe your own profile");
    }

    return prisma.$transaction(async (tx) => {
      // Get the membership
      const membership = await tx.membership.findFirst({
        where: { id, businessId: ctx.businessId },
      });

      if (!membership) return fail(404, "Membership not found");
      if (!membership.isActive) return fail(400, "Membership is no longer available");

      const client = await tx.client.findFirst({ where: { id: input.clientId, businessId: ctx.businessId }, select: { id: true } });
      if (!client) return fail(404, "Client not found");

      // Check for existing active subscription
      const existingSubscription = await tx.membershipSubscription.findFirst({
        where: {
          clientId: input.clientId,
          membershipId: id,
          status: "active",
        },
      });

      if (existingSubscription) {
        return fail(400, "Client already has an active subscription to this membership");
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
      const subscription = await tx.membershipSubscription.create({
        data: {
          membershipId: id,
          clientId: input.clientId,
          nextBillingDate,
          lastPaymentDate: new Date(),
          lastPaymentAmount: membership.price,
          paymentMethod: input.paymentMethod,
          stripeSubscriptionId: input.stripeSubscriptionId,
        },
        include: {
          membership: true,
        },
      });

      // Create activity for client
      await tx.activity.create({
        data: {
          clientId: input.clientId,
          userId: ctx.user.id,
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

      return {
        ...subscription,
        lastPaymentAmount: subscription.lastPaymentAmount
          ? Number(subscription.lastPaymentAmount)
          : null,
        membership: {
          ...subscription.membership,
          price: Number(subscription.membership.price),
          discountPercent: Number(subscription.membership.discountPercent),
        },
      };
    });
  });
}
