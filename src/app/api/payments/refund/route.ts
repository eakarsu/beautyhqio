import { NextRequest, NextResponse } from "next/server";
import { createRefund } from "@/lib/stripe";
import { requireRoles } from "@/lib/api-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// POST /api/payments/refund - Process a refund
export async function POST(request: NextRequest) {
  try {
    const actor = await requireRoles(["OWNER", "MANAGER"]);
    if (actor instanceof NextResponse) return actor;
    if (!actor.isPlatformAdmin && !actor.businessId) return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    const { paymentIntentId, amount, reason, transactionId } = z.object({
      paymentIntentId: z.string().min(1), amount: z.number().finite().positive().optional(),
      reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
      transactionId: z.string().min(1).optional(),
    }).parse(await request.json().catch(() => null));
    // Bind the provider payment to an authorized transaction before issuing a refund.
    const payment = await prisma.transactionPayment.findFirst({
      where: { stripePaymentId: paymentIntentId, ...(transactionId ? { transactionId } : {}),
        transaction: actor.isPlatformAdmin ? {} : { location: { businessId: actor.businessId! } } },
      include: { transaction: true },
    });
    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    if (amount !== undefined && (Math.round(amount * 100) < 1 || amount > Number(payment.amount))) return NextResponse.json({ error: "Invalid refund amount" }, { status: 422 });
    const authorizedTransactionId = payment.transactionId;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "paymentIntentId is required" },
        { status: 400 }
      );
    }

    // Create refund in Stripe
    const refund = await createRefund(
      paymentIntentId,
      amount ? Math.round(amount * 100) : undefined,
      reason
    );

    // Update transaction if provided
    if (authorizedTransactionId) {
      await prisma.transaction.update({
        where: { id: authorizedTransactionId },
        data: {
          status: amount !== undefined && amount < Number(payment.amount) ? "COMPLETED" : "REFUNDED", // Partial vs full refund
        },
      });

      // Create activity log
      const transaction = await prisma.transaction.findUnique({
        where: { id: authorizedTransactionId },
        select: { clientId: true },
      });

      if (transaction?.clientId) {
        await prisma.activity.create({
          data: {
            clientId: transaction.clientId,
            type: "PURCHASE",
            title: "Refund processed",
            description: `$${(refund.amount / 100).toFixed(2)} refunded`,
            metadata: {
              refundId: refund.id,
              transactionId: authorizedTransactionId,
              amount: refund.amount / 100,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 422 });
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
