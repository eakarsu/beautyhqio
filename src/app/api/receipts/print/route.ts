import { NextRequest, NextResponse } from "next/server";
import { buildReceiptData, generateReceiptText, generateESCPOS } from "@/lib/receipt";
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

// POST /api/receipts/print - Get printable receipt data for a tenant transaction
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...RECEIPT_ROLES]);
    const body = await request.json().catch(() => ({}));
    const { transactionId, format = "text" } = body;

    if (!transactionId) fail(422, "transactionId is required");

    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, location: { businessId: ctx.businessId } },
      include: transactionInclude,
    });

    if (!transaction) fail(404, "Transaction not found");

    const settings = await prisma.settings.findFirst();
    const receiptData = buildReceiptData(transaction, settings);

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
  });
}
