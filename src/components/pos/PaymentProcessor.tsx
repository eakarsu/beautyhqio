"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Banknote,
  Gift,
  Wallet,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface PaymentProcessorProps {
  total: number;
  onProcessPayment: (paymentData: PaymentData) => Promise<{ success: boolean; error?: string }>;
  clientBalance?: number;
  giftCardBalance?: number;
  loyaltyPoints?: number;
  loyaltyPointsValue?: number;
}

interface PaymentData {
  method: "card" | "cash" | "gift_card" | "split";
  amount: number;
  cashReceived?: number;
  giftCardCode?: string;
  splitPayments?: Array<{
    method: "card" | "cash" | "gift_card";
    amount: number;
  }>;
}

export function PaymentProcessor({
  total,
  onProcessPayment,
  clientBalance = 0,
  giftCardBalance = 0,
  loyaltyPoints = 0,
  loyaltyPointsValue = 0,
}: PaymentProcessorProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "gift_card" | "split">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  const effectiveTotal = useLoyaltyPoints ? total - loyaltyPointsValue : total;
  const changeDue = paymentMethod === "cash" ? Math.max(0, parseFloat(cashReceived || "0") - effectiveTotal) : 0;

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus("idle");
    setErrorMessage("");

    try {
      const paymentData: PaymentData = {
        method: paymentMethod,
        amount: effectiveTotal,
        ...(paymentMethod === "cash" && { cashReceived: parseFloat(cashReceived) }),
        ...(paymentMethod === "gift_card" && { giftCardCode }),
      };

      const result = await onProcessPayment(paymentData);

      if (result.success) {
        setPaymentStatus("success");
      } else {
        setPaymentStatus("error");
        setErrorMessage(result.error || "Payment failed");
      }
    } catch (error) {
      setPaymentStatus("error");
      setErrorMessage("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const quickCashAmounts = [20, 50, 100].filter((amount) => amount >= effectiveTotal);

  if (paymentStatus === "success") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-800 mb-2">Payment Successful</h3>
          <p className="text-green-600">
            ${effectiveTotal.toFixed(2)} paid via {paymentMethod}
          </p>
          {changeDue > 0 && (
            <p className="text-lg font-medium text-green-700 mt-2">
              Change Due: ${changeDue.toFixed(2)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Payment</span>
          <span className="text-2xl">${effectiveTotal.toFixed(2)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loyalty Points */}
        {loyaltyPoints > 0 && (
          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div>
              <p className="font-medium text-amber-800">Use Loyalty Points</p>
              <p className="text-sm text-amber-600">
                {loyaltyPoints} points = ${loyaltyPointsValue.toFixed(2)}
              </p>
            </div>
            <Button
              variant={useLoyaltyPoints ? "default" : "outline"}
              size="sm"
              onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
            >
              {useLoyaltyPoints ? "Applied" : "Apply"}
            </Button>
          </div>
        )}

        {/* Payment Methods */}
        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="card" className="flex flex-col gap-1 py-3">
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">Card</span>
            </TabsTrigger>
            <TabsTrigger value="cash" className="flex flex-col gap-1 py-3">
              <Banknote className="h-5 w-5" />
              <span className="text-xs">Cash</span>
            </TabsTrigger>
            <TabsTrigger value="gift_card" className="flex flex-col gap-1 py-3">
              <Gift className="h-5 w-5" />
              <span className="text-xs">Gift Card</span>
            </TabsTrigger>
            <TabsTrigger value="split" className="flex flex-col gap-1 py-3">
              <Wallet className="h-5 w-5" />
              <span className="text-xs">Split</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-4">
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Insert, tap, or swipe card on terminal
              </p>
            </div>
          </TabsContent>

          <TabsContent value="cash" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Cash Received</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="pl-8 text-lg"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {quickCashAmounts.length > 0 && (
              <div className="flex gap-2">
                {quickCashAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCashReceived(amount.toString())}
                  >
                    ${amount}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCashReceived(effectiveTotal.toFixed(2))}
                >
                  Exact
                </Button>
              </div>
            )}

            {parseFloat(cashReceived || "0") >= effectiveTotal && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm text-green-600">Change Due</p>
                <p className="text-2xl font-bold text-green-700">${changeDue.toFixed(2)}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gift_card" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Gift Card Code</Label>
              <Input
                value={giftCardCode}
                onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                placeholder="Enter gift card code"
                className="uppercase"
              />
            </div>

            {giftCardBalance > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Card Balance</p>
                <p className="text-lg font-semibold">${giftCardBalance.toFixed(2)}</p>
                {giftCardBalance < effectiveTotal && (
                  <Badge variant="secondary" className="mt-1">
                    Remaining ${(effectiveTotal - giftCardBalance).toFixed(2)} due
                  </Badge>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="split" className="mt-4">
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Split payment between multiple methods
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Message */}
        {paymentStatus === "error" && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Client Account Balance */}
        {clientBalance > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-600">Client Account Balance</p>
            <p className="text-lg font-semibold text-blue-800">${clientBalance.toFixed(2)}</p>
          </div>
        )}

        {/* Process Payment Button */}
        <Button
          className="w-full h-14 text-lg"
          onClick={handlePayment}
          disabled={
            isProcessing ||
            (paymentMethod === "cash" && parseFloat(cashReceived || "0") < effectiveTotal) ||
            (paymentMethod === "gift_card" && !giftCardCode)
          }
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${effectiveTotal.toFixed(2)}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
