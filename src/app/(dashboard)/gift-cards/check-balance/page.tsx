"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface GiftCardResult {
  id: string;
  code: string;
  initialBalance: number | string;
  currentBalance: number | string;
  status: string;
  recipientName?: string;
  recipientEmail?: string;
  expiresAt?: string;
  purchasedAt: string;
}

export default function CheckBalancePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GiftCardResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toNumber = (val: number | string | undefined): number => {
    if (val === undefined || val === null) return 0;
    return typeof val === "string" ? parseFloat(val) : val;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter a gift card code");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/gift-cards/check-balance?code=${encodeURIComponent(code.trim())}`);

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else if (response.status === 404) {
        setError("Gift card not found. Please check the code and try again.");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to check balance");
      }
    } catch (err) {
      console.error("Error checking balance:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "REDEEMED":
        return "secondary";
      case "EXPIRED":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/gift-cards")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Check Gift Card Balance</h1>
          <p className="text-muted-foreground">Enter a gift card code to check its balance</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gift Card Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label>Gift Card Code</Label>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., GC-ABC12345"
                  className="font-mono"
                />
                <Button type="submit" disabled={isLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? "Checking..." : "Check"}
                </Button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-green-700 font-medium">Gift Card Found</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Code</span>
                  <span className="font-mono font-medium">{result.code}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Status</span>
                  <Badge variant={getStatusVariant(result.status)}>
                    {result.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Original Value</span>
                  <span>{formatCurrency(toNumber(result.initialBalance))}</span>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-slate-900 font-medium">Current Balance</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(toNumber(result.currentBalance))}
                  </span>
                </div>

                {result.recipientName && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-slate-600">Recipient</span>
                    <span>{result.recipientName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Purchased</span>
                  <span>{formatDate(new Date(result.purchasedAt))}</span>
                </div>

                {result.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Expires</span>
                    <span>{formatDate(new Date(result.expiresAt))}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/gift-cards/${result.id}`)}
                >
                  View Details
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/pos?giftCard=${result.code}`)}
                >
                  Use at POS
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
