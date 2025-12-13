"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CreditCard,
  User,
  Mail,
  Calendar,
  DollarSign,
  History,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface GiftCardUsage {
  id: string;
  amount: number | string;
  usedAt: string;
  transactionId?: string;
}

interface GiftCard {
  id: string;
  code: string;
  initialBalance: number | string;
  currentBalance: number | string;
  status: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  purchasedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  expiresAt?: string;
  purchasedAt: string;
  usageHistory: GiftCardUsage[];
}

export default function GiftCardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const toNumber = (val: number | string | undefined): number => {
    if (val === undefined || val === null) return 0;
    return typeof val === "string" ? parseFloat(val) : val;
  };

  useEffect(() => {
    async function fetchGiftCard() {
      try {
        const response = await fetch(`/api/gift-cards/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setGiftCard(data);
        }
      } catch (error) {
        console.error("Error fetching gift card:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) {
      fetchGiftCard();
    }
  }, [params.id]);

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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-slate-500">Loading gift card...</div>
      </div>
    );
  }

  if (!giftCard) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/gift-cards")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Gift Card Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-500">The gift card you're looking for doesn't exist.</p>
            <Button className="mt-4" onClick={() => router.push("/gift-cards")}>
              Back to Gift Cards
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usedAmount = toNumber(giftCard.initialBalance) - toNumber(giftCard.currentBalance);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/gift-cards")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{giftCard.code}</h1>
              <Badge variant={getStatusVariant(giftCard.status)}>
                {giftCard.status}
              </Badge>
            </div>
            <p className="text-slate-500">Gift Card Details</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/pos?giftCard=${giftCard.code}`)}>
          Use at POS
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Balance Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Original Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(toNumber(giftCard.initialBalance))}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(toNumber(giftCard.currentBalance))}
                </p>
              </div>
              <div className="text-center p-4 bg-rose-50 rounded-lg">
                <p className="text-sm text-rose-600 mb-1">Used</p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatCurrency(usedAmount)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Balance remaining</span>
                <span className="font-medium">
                  {Math.round((toNumber(giftCard.currentBalance) / toNumber(giftCard.initialBalance)) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${(toNumber(giftCard.currentBalance) / toNumber(giftCard.initialBalance)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {giftCard.recipientName && (
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Recipient</p>
                  <p className="font-medium">{giftCard.recipientName}</p>
                  {giftCard.recipientEmail && (
                    <p className="text-sm text-slate-500">{giftCard.recipientEmail}</p>
                  )}
                </div>
              </div>
            )}

            {giftCard.purchasedBy && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Purchased By</p>
                  <p className="font-medium">
                    {giftCard.purchasedBy.firstName} {giftCard.purchasedBy.lastName}
                  </p>
                  {giftCard.purchasedBy.email && (
                    <p className="text-sm text-slate-500">{giftCard.purchasedBy.email}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-slate-400 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Purchased</p>
                <p className="font-medium">{formatDate(new Date(giftCard.purchasedAt))}</p>
              </div>
            </div>

            {giftCard.expiresAt && (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Expires</p>
                  <p className="font-medium">{formatDate(new Date(giftCard.expiresAt))}</p>
                </div>
              </div>
            )}

            {giftCard.message && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Message</p>
                  <p className="text-sm italic">"{giftCard.message}"</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Usage History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {giftCard.usageHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No usage history yet. This gift card hasn't been used.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giftCard.usageHistory.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell>{formatDate(new Date(usage.usedAt))}</TableCell>
                    <TableCell className="font-medium text-rose-600">
                      -{formatCurrency(toNumber(usage.amount))}
                    </TableCell>
                    <TableCell>
                      {usage.transactionId ? (
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => router.push(`/transactions/${usage.transactionId}`)}
                        >
                          View Transaction
                        </Button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
