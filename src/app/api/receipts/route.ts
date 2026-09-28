import { NextRequest, NextResponse } from "next/server";
import {
  buildReceiptData,
  generateReceiptHTML,
  generateReceiptText,
  emailReceipt,
} from "@/lib/receipt";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const RECEIPT_ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;

const transactionInclude = {
  client: true,
  staff: { include: { user: { select: { firstName: true, lastName: true } } } },
  lineItems: { include: { service: true, product: true } },
  payments: true,
  tips: true,
} as const;

function findTenantTransaction(businessId: string, transactionId: string) {
  // Transactions belong to a location, and locations belong to a business.
  return prisma.transaction.findFirst({
    where: { id: transactionId, location: { businessId } },
    include: transactionInclude,
  });
}

// GET /api/receipts - Get a receipt for one of this business's transactions
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...RECEIPT_ROLES]);
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const format = searchParams.get("format") || "html";

    if (!transactionId) fail(422, "transactionId is required");

    const transaction = await findTenantTransaction(ctx.businessId, transactionId);
    if (!transaction) fail(404, "Transaction not found");

    const settings = await prisma.settings.findFirst();
    const receiptData = buildReceiptData(transaction, settings);

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
  });
}

// POST /api/receipts - Email a receipt to the client
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...RECEIPT_ROLES]);
    const body = await request.json().catch(() => ({}));
    const { transactionId, email } = body;

    if (!transactionId) fail(422, "transactionId is required");

    const transaction = await findTenantTransaction(ctx.businessId, transactionId);
    if (!transaction) fail(404, "Transaction not found");

    // Determine recipient email
    const recipientEmail = email || transaction.client?.email;

    if (!recipientEmail) fail(422, "No email address provided");

    const settings = await prisma.settings.findFirst();
    const receiptData = buildReceiptData(transaction, settings);

    // Send email through the configured provider
    const result = await emailReceipt(recipientEmail, receiptData);

    if (!result.success) {
      fail(502, result.error || "Failed to send email");
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
  });
}
