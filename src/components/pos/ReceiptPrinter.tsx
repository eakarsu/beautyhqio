"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Printer, Mail, MessageSquare, Download, Check } from "lucide-react";
import { format } from "date-fns";

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  type: "service" | "product";
}

interface Receipt {
  id: string;
  transactionId: string;
  date: Date;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  discountCode?: string;
  tip?: number;
  total: number;
  paymentMethod: string;
  client?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  staff?: {
    firstName: string;
    lastName: string;
  };
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
}

interface ReceiptPrinterProps {
  receipt: Receipt;
  open: boolean;
  onClose: () => void;
  onEmailSent?: () => void;
  onSmsSent?: () => void;
}

export function ReceiptPrinter({
  receipt,
  open,
  onClose,
  onEmailSent,
  onSmsSent,
}: ReceiptPrinterProps) {
  const [isSending, setIsSending] = useState(false);
  const [sentMethod, setSentMethod] = useState<"email" | "sms" | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${receipt.transactionId}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 300px;
              margin: 0 auto;
              padding: 20px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-4 { margin-top: 16px; }
            .border-t { border-top: 1px dashed #000; padding-top: 8px; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; }
            table { width: 100%; }
            td { padding: 2px 0; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleEmail = async () => {
    if (!receipt.client?.email) return;

    setIsSending(true);
    try {
      await fetch("/api/receipts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: receipt.id,
          method: "email",
          email: receipt.client.email,
        }),
      });
      setSentMethod("email");
      onEmailSent?.();
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSms = async () => {
    if (!receipt.client?.phone) return;

    setIsSending(true);
    try {
      await fetch("/api/receipts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: receipt.id,
          method: "sms",
          phone: receipt.client.phone,
        }),
      });
      setSentMethod("sms");
      onSmsSent?.();
    } catch (error) {
      console.error("Error sending SMS:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = () => {
    const content = receiptRef.current?.innerText;
    if (!content) return;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${receipt.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Receipt
          </DialogTitle>
          <DialogDescription>
            Print, email, or text this receipt to the client
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Preview */}
        <div
          ref={receiptRef}
          className="bg-white border rounded-lg p-4 font-mono text-sm max-h-[400px] overflow-y-auto"
        >
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{receipt.businessName}</h2>
            {receipt.businessAddress && (
              <p className="text-xs text-muted-foreground">{receipt.businessAddress}</p>
            )}
            {receipt.businessPhone && (
              <p className="text-xs text-muted-foreground">{receipt.businessPhone}</p>
            )}
          </div>

          <Separator className="my-3" />

          {/* Transaction Info */}
          <div className="text-xs mb-3">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span>{receipt.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{format(receipt.date, "MMM d, yyyy h:mm a")}</span>
            </div>
            {receipt.staff && (
              <div className="flex justify-between">
                <span>Served by:</span>
                <span>
                  {receipt.staff.firstName} {receipt.staff.lastName}
                </span>
              </div>
            )}
            {receipt.client && (
              <div className="flex justify-between">
                <span>Client:</span>
                <span>
                  {receipt.client.firstName} {receipt.client.lastName}
                </span>
              </div>
            )}
          </div>

          <Separator className="my-3" />

          {/* Items */}
          <div className="space-y-2">
            {receipt.items.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <div>
                  <span>{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground"> x{item.quantity}</span>
                  )}
                </div>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${receipt.subtotal.toFixed(2)}</span>
            </div>
            {receipt.discount && receipt.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount{receipt.discountCode && ` (${receipt.discountCode})`}:
                </span>
                <span>-${receipt.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${receipt.tax.toFixed(2)}</span>
            </div>
            {receipt.tip && receipt.tip > 0 && (
              <div className="flex justify-between">
                <span>Tip:</span>
                <span>${receipt.tip.toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL:</span>
              <span>${receipt.total.toFixed(2)}</span>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Payment Method */}
          <div className="text-xs text-center">
            <p>Paid by: {receipt.paymentMethod}</p>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 text-xs text-muted-foreground">
            <p>Thank you for your visit!</p>
            <p>We hope to see you again soon.</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button variant="outline" className="flex-1" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleEmail}
              disabled={!receipt.client?.email || isSending}
            >
              {sentMethod === "email" ? (
                <Check className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Email
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSms}
              disabled={!receipt.client?.phone || isSending}
            >
              {sentMethod === "sms" ? (
                <Check className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              Text
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
