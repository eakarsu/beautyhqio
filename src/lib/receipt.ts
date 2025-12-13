// Receipt Generation Library
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export interface ReceiptData {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  transactionId: string;
  date: Date;
  client?: {
    name: string;
    email?: string;
    phone?: string;
  };
  staff?: {
    name: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
    discount?: number;
  }[];
  subtotal: number;
  tax: number;
  taxRate: number;
  tip?: number;
  discount?: number;
  total: number;
  payments: {
    method: string;
    amount: number;
    reference?: string;
  }[];
  notes?: string;
}

// Generate receipt HTML
export function generateReceiptHTML(data: ReceiptData): string {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const itemsHTML = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity - (item.discount || 0))}</td>
      </tr>
    `
    )
    .join("");

  const paymentsHTML = data.payments
    .map(
      (payment) => `
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span>${payment.method}</span>
        <span>${formatCurrency(payment.amount)}</span>
      </div>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${data.transactionId}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .receipt { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .business-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
    .business-info { font-size: 12px; color: #666; }
    .transaction-info { font-size: 12px; color: #666; margin-bottom: 20px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { text-align: left; padding: 8px; border-bottom: 2px solid #333; font-size: 12px; text-transform: uppercase; }
    .totals { border-top: 1px solid #333; padding-top: 15px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
    .payments { margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ccc; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    @media print { body { background: white; padding: 0; } .receipt { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="business-name">${data.businessName}</div>
      ${data.businessAddress ? `<div class="business-info">${data.businessAddress}</div>` : ""}
      ${data.businessPhone ? `<div class="business-info">${data.businessPhone}</div>` : ""}
      ${data.businessEmail ? `<div class="business-info">${data.businessEmail}</div>` : ""}
    </div>

    <div class="transaction-info">
      <div><strong>Receipt #:</strong> ${data.transactionId}</div>
      <div><strong>Date:</strong> ${formatDate(data.date)}</div>
      <div><strong>Client:</strong> ${data.client?.name || "Walk-in"}</div>
      ${data.staff ? `<div><strong>Staff:</strong> ${data.staff.name}</div>` : ""}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${
        data.discount
          ? `
      <div class="total-row" style="color: #e74c3c;">
        <span>Discount</span>
        <span>-${formatCurrency(data.discount)}</span>
      </div>
      `
          : ""
      }
      <div class="total-row">
        <span>Tax (${data.taxRate}%)</span>
        <span>${formatCurrency(data.tax)}</span>
      </div>
      ${
        data.tip
          ? `
      <div class="total-row">
        <span>Tip</span>
        <span>${formatCurrency(data.tip)}</span>
      </div>
      `
          : ""
      }
      <div class="total-row grand-total">
        <span>Total</span>
        <span>${formatCurrency(data.total)}</span>
      </div>
    </div>

    <div class="payments">
      <div style="font-weight: bold; margin-bottom: 10px;">Payment Method${data.payments.length > 1 ? "s" : ""}</div>
      ${paymentsHTML}
    </div>

    ${data.notes ? `<div style="margin-top: 20px; font-size: 12px; color: #666;"><strong>Notes:</strong> ${data.notes}</div>` : ""}

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>We appreciate you choosing ${data.businessName}</p>
    </div>
  </div>
</body>
</html>
`;
}

// Generate receipt text (for thermal printers)
export function generateReceiptText(data: ReceiptData): string {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const divider = "=".repeat(40);
  const line = "-".repeat(40);

  let receipt = `
${divider}
${data.businessName.toUpperCase().padStart((40 + data.businessName.length) / 2)}
${data.businessAddress ? data.businessAddress.padStart((40 + data.businessAddress.length) / 2) : ""}
${data.businessPhone ? data.businessPhone.padStart((40 + data.businessPhone.length) / 2) : ""}
${divider}

Receipt #: ${data.transactionId}
Date: ${formatDate(data.date)}
Client: ${data.client?.name || "Walk-in"}
${data.staff ? `Staff: ${data.staff.name}` : ""}
${line}
`;

  // Items
  data.items.forEach((item) => {
    const itemTotal = item.price * item.quantity - (item.discount || 0);
    const nameQty = `${item.name} x${item.quantity}`;
    const price = formatCurrency(itemTotal);
    receipt += `${nameQty.padEnd(30)}${price.padStart(10)}\n`;
  });

  receipt += `${line}
${"Subtotal:".padEnd(30)}${formatCurrency(data.subtotal).padStart(10)}
`;

  if (data.discount) {
    receipt += `${"Discount:".padEnd(30)}${("-" + formatCurrency(data.discount)).padStart(10)}\n`;
  }

  receipt += `${`Tax (${data.taxRate}%):`.padEnd(30)}${formatCurrency(data.tax).padStart(10)}
`;

  if (data.tip) {
    receipt += `${"Tip:".padEnd(30)}${formatCurrency(data.tip).padStart(10)}\n`;
  }

  receipt += `${divider}
${"TOTAL:".padEnd(30)}${formatCurrency(data.total).padStart(10)}
${divider}

PAYMENT:
`;

  data.payments.forEach((payment) => {
    receipt += `${payment.method.padEnd(30)}${formatCurrency(payment.amount).padStart(10)}\n`;
  });

  receipt += `
${line}
${"Thank you for your business!".padStart((40 + 26) / 2)}
${"We appreciate you choosing us!".padStart((40 + 28) / 2)}
${divider}
`;

  return receipt;
}

// Send receipt via email
export async function emailReceipt(
  to: string,
  data: ReceiptData
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: "Email service not configured" };
  }

  const html = generateReceiptHTML(data);

  try {
    await resend.emails.send({
      from: `${data.businessName} <receipts@${process.env.EMAIL_DOMAIN || "beautywellness.com"}>`,
      to,
      subject: `Receipt from ${data.businessName} - ${data.transactionId}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending receipt email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// Generate ESC/POS commands for thermal printer
export function generateESCPOS(data: ReceiptData): Buffer {
  // ESC/POS command codes
  const ESC = 0x1b;
  const GS = 0x1d;

  const commands: number[] = [];

  // Initialize printer
  commands.push(ESC, 0x40); // ESC @ - Initialize

  // Center align
  commands.push(ESC, 0x61, 0x01); // ESC a 1 - Center

  // Bold on
  commands.push(ESC, 0x45, 0x01);

  // Business name
  const businessName = data.businessName + "\n";
  for (let i = 0; i < businessName.length; i++) {
    commands.push(businessName.charCodeAt(i));
  }

  // Bold off
  commands.push(ESC, 0x45, 0x00);

  // Business info
  if (data.businessAddress) {
    for (let i = 0; i < (data.businessAddress + "\n").length; i++) {
      commands.push((data.businessAddress + "\n").charCodeAt(i));
    }
  }

  // Left align for items
  commands.push(ESC, 0x61, 0x00);

  // Add rest of receipt text
  const text = generateReceiptText(data);
  const lines = text.split("\n").slice(5); // Skip header lines we already added

  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      commands.push(line.charCodeAt(i));
    }
    commands.push(0x0a); // Line feed
  }

  // Cut paper
  commands.push(GS, 0x56, 0x00); // GS V 0 - Full cut

  return Buffer.from(commands);
}
