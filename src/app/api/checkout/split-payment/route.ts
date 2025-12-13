import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";

// POST /api/checkout/split-payment - Process split payment for a transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transactionId,
      payments,
      tips = [],
    } = body;

    if (!transactionId || !payments?.length) {
      return NextResponse.json(
        { error: "transactionId and payments array are required" },
        { status: 400 }
      );
    }

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        payments: true,
        lineItems: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Calculate total payments
    const totalPayments = payments.reduce(
      (sum: number, p: { amount: number }) => sum + p.amount,
      0
    );
    const totalTips = tips.reduce(
      (sum: number, t: { amount: number }) => sum + t.amount,
      0
    );

    // Verify payment covers transaction total
    const requiredAmount = Number(transaction.totalAmount);
    if (totalPayments < requiredAmount) {
      return NextResponse.json(
        {
          error: `Payment total ($${totalPayments.toFixed(2)}) is less than required amount ($${requiredAmount.toFixed(2)})`,
        },
        { status: 400 }
      );
    }

    // Create payment records
    const paymentRecords = await Promise.all(
      payments.map(
        async (payment: {
          method: PaymentMethod;
          amount: number;
          reference?: string;
          giftCardId?: string;
        }) => {
          // If gift card payment, update gift card balance
          if (payment.method === "GIFT_CARD" && payment.giftCardId) {
            const giftCard = await prisma.giftCard.findUnique({
              where: { id: payment.giftCardId },
            });

            if (!giftCard || Number(giftCard.currentBalance) < payment.amount) {
              throw new Error("Insufficient gift card balance");
            }

            await prisma.giftCard.update({
              where: { id: payment.giftCardId },
              data: {
                currentBalance: {
                  decrement: payment.amount,
                },
              },
            });

            await prisma.giftCardUsage.create({
              data: {
                giftCardId: payment.giftCardId,
                amount: payment.amount,
                balanceAfter: Number(giftCard.currentBalance) - payment.amount,
              },
            });
          }

          return prisma.transactionPayment.create({
            data: {
              transactionId,
              method: payment.method,
              amount: payment.amount,
              reference: payment.reference,
              giftCardId: payment.giftCardId,
            },
          });
        }
      )
    );

    // Create tip records
    let tipRecords: unknown[] = [];
    if (tips.length > 0) {
      tipRecords = await Promise.all(
        tips.map(
          (tip: { staffId: string; amount: number; method?: PaymentMethod }) =>
            prisma.tip.create({
              data: {
                transactionId,
                staffId: tip.staffId,
                amount: tip.amount,
                method: tip.method || "CREDIT_CARD",
              },
            })
        )
      );
    }

    // Update transaction with tip amount
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        tipAmount: totalTips,
        status: "COMPLETED",
      },
    });

    // Get updated transaction
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        payments: true,
        tips: {
          include: {
            staff: {
              select: { displayName: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        ...updatedTransaction,
        totalAmount: Number(updatedTransaction?.totalAmount),
        tipAmount: Number(updatedTransaction?.tipAmount),
        payments: updatedTransaction?.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
        tips: updatedTransaction?.tips.map((t) => ({
          ...t,
          amount: Number(t.amount),
        })),
      },
      paymentBreakdown: {
        subtotal: Number(transaction.subtotal),
        tax: Number(transaction.taxAmount),
        discount: Number(transaction.discountAmount),
        total: Number(transaction.totalAmount),
        tips: totalTips,
        grandTotal: requiredAmount + totalTips,
        payments: payments.map((p: { method: string; amount: number }) => ({
          method: p.method,
          amount: p.amount,
        })),
      },
    });
  } catch (error) {
    console.error("Error processing split payment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process split payment" },
      { status: 500 }
    );
  }
}
