import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// POST /api/webhooks/stripe - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    let event: Stripe.Event;

    try {
      event = constructWebhookEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment succeeded:", paymentIntent.id);

        // Update transaction if metadata contains transactionId
        if (paymentIntent.metadata?.transactionId) {
          await prisma.transaction.update({
            where: { id: paymentIntent.metadata.transactionId },
            data: { status: "COMPLETED" },
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);

        if (paymentIntent.metadata?.transactionId) {
          await prisma.transaction.update({
            where: { id: paymentIntent.metadata.transactionId },
            data: { status: "PENDING" },
          });
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription created:", subscription.id);
        // Handle membership subscription creation
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);

        // Update membership subscription status
        await prisma.membershipSubscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === "active" ? "active" : "paused",
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription cancelled:", subscription.id);

        await prisma.membershipSubscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
          },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | { id: string } };
        console.log("Invoice paid:", invoice.id);

        // Update membership subscription payment info
        // Get subscription from invoice (subscription property may be string or Subscription object)
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

        if (subscriptionId) {
          await prisma.membershipSubscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              lastPaymentDate: new Date(),
              lastPaymentAmount: (invoice.amount_paid || 0) / 100,
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment failed:", invoice.id);
        // Handle failed subscription payment
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("Charge refunded:", charge.id);
        break;
      }

      // Stripe Connect events for staff payouts
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        console.log("Connect account updated:", account.id);

        // Determine account status
        let status = "pending";
        if (account.charges_enabled && account.payouts_enabled) {
          status = "active";
        } else if (account.requirements?.disabled_reason) {
          status = "restricted";
        }

        // Update staff record
        await prisma.staff.updateMany({
          where: { stripeAccountId: account.id },
          data: { stripeAccountStatus: status },
        });
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        console.log("Payout completed:", payout.id, "Amount:", payout.amount / 100);
        // Could log payout to database if needed
        break;
      }

      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;
        console.log("Transfer created:", transfer.id, "to:", transfer.destination);
        // Could log transfer to database if needed
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
