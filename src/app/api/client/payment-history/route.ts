import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia" as any,
});

// GET /api/client/payment-history - Get client's payment history from Stripe
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find client profile
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: user.email },
        ],
      },
    });

    if (!client?.stripeCustomerId) {
      return NextResponse.json({ payments: [] });
    }

    // Get payment intents from Stripe for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: client.stripeCustomerId,
      limit: 50,
    });

    // Format the payments
    const payments = await Promise.all(
      paymentIntents.data.map(async (pi) => {
        let paymentMethodDetails = null;
        if (pi.payment_method && typeof pi.payment_method === "string") {
          try {
            paymentMethodDetails = await stripe.paymentMethods.retrieve(pi.payment_method);
          } catch {
            // Payment method may have been deleted
          }
        }

        return {
          id: pi.id,
          amount: pi.amount,
          status: pi.status,
          date: new Date(pi.created * 1000).toISOString(),
          description: pi.description || "Payment",
          last4: paymentMethodDetails?.card?.last4,
          brand: paymentMethodDetails?.card?.brand,
        };
      })
    );

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json({ payments: [] });
  }
}
