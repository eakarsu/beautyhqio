import { NextRequest, NextResponse } from "next/server";
import { generateReceiptText, generateESCPOS, ReceiptData } from "@/lib/receipt";
import { prisma } from "@/lib/prisma";

// POST /api/receipts/print - Get printable receipt data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, format = "text" } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }

    // Get transaction with all related data
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        client: true,
        staff: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        lineItems: {
          include: {
            service: true,
            product: true,
          },
        },
        payments: true,
        tips: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Get business settings
    const settings = await prisma.settings.findFirst();

    // Build receipt data
    const receiptData: ReceiptData = {
      businessName: settings?.businessName || "Beauty & Wellness",
      businessAddress: settings?.address || undefined,
      businessPhone: settings?.phone || undefined,
      businessEmail: settings?.email || undefined,
      transactionId: transaction.id,
      date: transaction.createdAt,
      client: transaction.client
        ? {
            name: `${transaction.client.firstName} ${transaction.client.lastName}`,
            email: transaction.client.email || undefined,
            phone: transaction.client.phone || undefined,
          }
        : undefined,
      staff: transaction.staff
        ? {
            name: transaction.staff.displayName ||
              `${transaction.staff.user.firstName} ${transaction.staff.user.lastName}`,
          }
        : undefined,
      items: transaction.lineItems.map((item) => ({
        name: item.service?.name || item.product?.name || "Item",
        quantity: item.quantity,
        price: Number(item.unitPrice),
        discount: undefined,
      })),
      subtotal: Number(transaction.subtotal),
      tax: Number(transaction.taxAmount),
      taxRate: settings?.taxRate ? Number(settings.taxRate) : 8.875,
      tip: transaction.tips.reduce((sum, t) => sum + Number(t.amount), 0) || undefined,
      discount: transaction.discountAmount ? Number(transaction.discountAmount) : undefined,
      total: Number(transaction.totalAmount),
      payments: transaction.payments.map((p) => ({
        method: p.method,
        amount: Number(p.amount),
        reference: p.reference || undefined,
      })),
      notes: transaction.notes || undefined,
    };

    // Generate print data based on format
    if (format === "escpos") {
      // Return ESC/POS binary commands for thermal printers
      const escposData = generateESCPOS(receiptData);
      return new NextResponse(new Uint8Array(escposData), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="receipt-${transactionId}.bin"`,
        },
      });
    }

    // Default: Return plain text for standard printing
    const textReceipt = generateReceiptText(receiptData);
    return NextResponse.json({
      success: true,
      text: textReceipt,
      data: receiptData,
    });
  } catch (error) {
    console.error("Error generating print receipt:", error);
    return NextResponse.json(
      { error: "Failed to generate print receipt" },
      { status: 500 }
    );
  }
}
