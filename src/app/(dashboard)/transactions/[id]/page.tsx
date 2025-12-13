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
  Receipt,
  User,
  Calendar,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TransactionItem {
  id: string;
  name: string;
  type: "SERVICE" | "PRODUCT";
  quantity: number;
  unitPrice: string;
  total: string;
}

interface Transaction {
  id: string;
  status: string;
  subtotal: string;
  tax: string;
  tip: string;
  discount: string;
  total: string;
  paymentMethod: string;
  createdAt: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
  };
  items: TransactionItem[];
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTransaction() {
      try {
        const response = await fetch(`/api/transactions/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setTransaction(data);
        }
      } catch (error) {
        console.error("Error fetching transaction:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) {
      fetchTransaction();
    }
  }, [params.id]);

  const toNumber = (val: string | number | undefined): number => {
    if (val === undefined || val === null) return 0;
    return typeof val === "string" ? parseFloat(val) : val;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-slate-500">
          Loading transaction...
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Transaction Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-500">
              The transaction you're looking for doesn't exist.
            </p>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Transaction Details</h1>
              <Badge
                variant={
                  transaction.status === "COMPLETED" ? "success" : "secondary"
                }
              >
                {transaction.status}
              </Badge>
            </div>
            <p className="text-slate-500">
              {formatDate(new Date(transaction.createdAt))}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Receipt className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(toNumber(item.unitPrice))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(toNumber(item.total))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(toNumber(transaction.subtotal))}</span>
              </div>
              {toNumber(transaction.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(toNumber(transaction.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span>{formatCurrency(toNumber(transaction.tax))}</span>
              </div>
              {toNumber(transaction.tip) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tip</span>
                  <span>{formatCurrency(toNumber(transaction.tip))}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(toNumber(transaction.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-6">
          {/* Client */}
          {transaction.client && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">
                    {transaction.client.firstName} {transaction.client.lastName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {transaction.client.phone}
                  </p>
                  {transaction.client.email && (
                    <p className="text-sm text-slate-500">
                      {transaction.client.email}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      router.push(`/clients/${transaction.client?.id}`)
                    }
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Method</span>
                  <Badge variant="outline">{transaction.paymentMethod}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge variant="success">{transaction.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="text-sm">
                    {formatDate(new Date(transaction.createdAt))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
