import { NextRequest, NextResponse } from "next/server";
import { buildReceiptData, emailReceipt, generateReceiptText } from "@/lib/receipt";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";
import { sendSMS } from "@/lib/twilio";

const RECEIPT_ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;

const transactionInclude = {
  client: true,
  staff: { include: { user: { select: { firstName: true, lastName: true } } } },
  lineItems: { include: { service: true, product: true } },
  payments: true,
  tips: true,
} as const;

// POST /api/receipts/send - Send one of this business's receipts by email or SMS.
// Success is only reported after the provider accepts (or explicitly rejects)
// the message; a missing provider configuration is an honest 503.
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...RECEIPT_ROLES]);
    const body = await request.json().catch(() => ({}));
    const transactionId =
      typeof body.transactionId === "string"
        ? body.transactionId
        : typeof body.receiptId === "string"
          ? body.receiptId
          : "";
    const method = body.method === "email" || body.method === "sms" ? body.method : null;

    if (!transactionId) fail(422, "transactionId is required");
    if (!method) fail(422, 'method must be "email" or "sms"');

    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, location: { businessId: ctx.businessId } },
      include: transactionInclude,
    });

    if (!transaction) fail(404, "Transaction not found");

    const settings = await prisma.settings.findFirst();
    const receiptData = buildReceiptData(transaction, settings);

    if (method === "email") {
      const recipient =
        typeof body.email === "string" && body.email
          ? body.email
          : transaction.client?.email;
      if (!recipient) fail(422, "No email address provided");

      const result = await emailReceipt(recipient, receiptData);
      if (!result.success) {
        fail(result.error === "Email service not configured" ? 503 : 502, result.error || "Failed to send email");
      }

      if (transaction.clientId) {
        await prisma.activity.create({
          data: {
            clientId: transaction.clientId,
            type: "EMAIL_SENT",
            title: "Receipt emailed",
            description: `Receipt sent to ${recipient}`,
            metadata: { transactionId, email: recipient },
          },
        });
      }

      return NextResponse.json({
        success: true,
        method,
        recipient,
        message: `Receipt sent to ${recipient}`,
        providerRef: result.messageId ?? null,
      });
    }

    const recipient =
      typeof body.phone === "string" && body.phone
        ? body.phone
        : transaction.client?.phone;
    if (!recipient) fail(422, "No phone number provided");

    const result = await sendSMS({ to: recipient, message: generateReceiptText(receiptData) });
    if (!result.success) {
      fail(result.error === "Twilio not configured" ? 503 : 502, result.error || "Failed to send SMS");
    }

    if (transaction.clientId) {
      await prisma.activity.create({
        data: {
          clientId: transaction.clientId,
          type: "SMS_SENT",
          title: "Receipt texted",
          description: `Receipt sent to ${recipient}`,
          metadata: { transactionId, phone: recipient },
        },
      });
    }

    return NextResponse.json({
      success: true,
      method,
      recipient,
      message: `Receipt sent to ${recipient}`,
      providerRef: result.messageId ?? null,
    });
  });
}
