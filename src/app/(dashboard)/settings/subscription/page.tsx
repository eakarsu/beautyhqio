"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Check, Zap, Crown, Building2 } from "lucide-react";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  monthlyPrice: number;
  commissionRate: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  subscriptionAmount: number;
  commissionAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
}

interface Business {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
}

const PLANS = [
  {
    name: "STARTER",
    displayName: "Starter",
    price: 0,
    commission: 20,
    icon: Building2,
    features: [
      "Listed on marketplace",
      "Basic profile",
      "20% commission on leads",
      "Email support",
    ],
  },
  {
    name: "GROWTH",
    displayName: "Growth",
    price: 49,
    commission: 12,
    icon: Zap,
    popular: true,
    features: [
      "Everything in Starter",
      "12% commission on leads",
      "Featured placement",
      "Analytics dashboard",
      "Priority support",
    ],
  },
  {
    name: "PRO",
    displayName: "Pro",
    price: 149,
    commission: 5,
    icon: Crown,
    features: [
      "Everything in Growth",
      "5% commission on leads",
      "Top placement",
      "Verified badge",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/test-subscription")
      .then((res) => res.json())
      .then((data) => {
        console.log("Subscription data:", data);
        if (data.subscription) {
          setSubscription(data.subscription);
          setBusiness(data.business);
          setInvoices(data.invoices || []);
        } else {
          setError(data.error || "No subscription found");
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      TRIAL: "bg-blue-100 text-blue-800",
      PAST_DUE: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      PAID: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || "bg-gray-100"}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Subscription</h1>
        <p>Loading subscription data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Subscription</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription & Billing</h1>
        <p className="text-gray-600">Manage your BeautyHQ marketplace subscription</p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold">{subscription.plan}</h3>
                  {getStatusBadge(subscription.status)}
                </div>
                <p className="text-gray-600">
                  ${subscription.monthlyPrice}/month • {subscription.commissionRate}% commission on leads
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-gray-500 mt-1">
                    Current period ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
                {subscription.trialEndsAt && (
                  <p className="text-sm text-blue-600 mt-1">
                    Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Business</p>
                <p className="font-medium">{business?.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.name;
            const Icon = plan.icon;

            return (
              <Card
                key={plan.name}
                className={`relative ${isCurrentPlan ? "border-2 border-rose-500" : ""} ${plan.popular ? "shadow-lg" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-rose-500">Most Popular</Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-500">Current Plan</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-6 w-6 text-rose-500" />
                    <CardTitle>{plan.displayName}</CardTitle>
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-rose-600 font-medium">
                    {plan.commission}% commission
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-4"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Current Plan" : `Upgrade to ${plan.displayName}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your recent invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${invoice.subscriptionAmount.toFixed(2)}</TableCell>
                    <TableCell>${invoice.commissionAmount.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">${invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
