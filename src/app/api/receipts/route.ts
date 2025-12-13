import { NextRequest, NextResponse } from "next/server";
import {
  generateReceiptHTML,
  generateReceiptText,
  emailReceipt,
  ReceiptData,
} from "@/lib/receipt";
import { prisma } from "@/lib/prisma";

// GET /api/receipts - Get receipt for a transaction
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const format = searchParams.get("format") || "html";

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

    // Generate receipt in requested format
    if (format === "text") {
      const text = generateReceiptText(receiptData);
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    if (format === "json") {
      return NextResponse.json(receiptData);
    }

    // Default: HTML
    const html = generateReceiptHTML(receiptData);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}

// POST /api/receipts - Email receipt to client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, email } = body;

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

    // Determine recipient email
    const recipientEmail = email || transaction.client?.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No email address provided" },
        { status: 400 }
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

    // Send email
    const result = await emailReceipt(recipientEmail, receiptData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Log activity
    if (transaction.clientId) {
      await prisma.activity.create({
        data: {
          clientId: transaction.clientId,
          type: "EMAIL_SENT",
          title: "Receipt emailed",
          description: `Receipt sent to ${recipientEmail}`,
          metadata: { transactionId, email: recipientEmail },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Receipt sent to ${recipientEmail}`,
    });
  } catch (error) {
    console.error("Error emailing receipt:", error);
    return NextResponse.json(
      { error: "Failed to email receipt" },
      { status: 500 }
    );
  }
}
