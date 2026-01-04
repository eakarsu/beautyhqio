"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap, Crown, Building2, Check, Calendar, DollarSign } from "lucide-react";

interface MySubscription {
  id: string;
  plan: string;
  status: string;
  monthlyPrice: number;
  commissionRate: number;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

const PLAN_DETAILS = [
  {
    name: "STARTER",
    price: 0,
    commission: 9,
    icon: Building2,
    color: "gray",
    description: "Get started for free",
    features: [
      "9% commission on leads",
      "Listed on marketplace",
      "Basic profile",
      "Email support",
    ],
  },
  {
    name: "GROWTH",
    price: 49,
    commission: 0,
    icon: Zap,
    color: "rose",
    description: "Perfect for growing salons",
    features: [
      "No commission on leads",
      "Featured placement",
      "Analytics dashboard",
      "Priority support",
      "Marketing tools",
    ],
  },
  {
    name: "PRO",
    price: 149,
    commission: 0,
    icon: Crown,
    color: "purple",
    description: "Best for established salons",
    features: [
      "No commission on leads",
      "Top placement in search",
      "Verified badge",
      "Dedicated account manager",
      "Custom integrations",
      "Priority support 24/7",
    ],
  },
];

export default function MySubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<MySubscription | null>(null);

  useEffect(() => {
    // Redirect platform admin to admin subscriptions page
    if (status === "authenticated" && session?.user?.isPlatformAdmin) {
      router.push("/admin/subscriptions");
      return;
    }

    // Redirect clients away
    if (status === "authenticated" && session?.user?.isClient) {
      router.push("/client");
      return;
    }

    if (status === "authenticated") {
      fetchMySubscription();
    }
  }, [session, status, router]);

  const fetchMySubscription = async () => {
    try {
      const response = await fetch("/api/my-subscription");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    // In real app, this would redirect to Stripe checkout
    alert(`Upgrade to ${plan} - Stripe checkout would open here`);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const currentPlan = PLAN_DETAILS.find((p) => p.name === subscription?.plan) || PLAN_DETAILS[0];
  const CurrentIcon = currentPlan.icon;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Subscription</h1>
        <p className="text-slate-600">Manage your subscription plan</p>
      </div>

      {/* Current Subscription */}
      <Card className="border-2 border-rose-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-lg">
                <CurrentIcon className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <CardTitle>Current Plan: {subscription?.plan || "STARTER"}</CardTitle>
                <CardDescription>
                  {subscription?.status === "ACTIVE"
                    ? "Your subscription is active"
                    : subscription?.status === "TRIAL"
                    ? "You are on a trial period"
                    : "Subscription status: " + subscription?.status}
                </CardDescription>
              </div>
            </div>
            <Badge
              className={
                subscription?.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : subscription?.status === "TRIAL"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }
            >
              {subscription?.status || "ACTIVE"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Monthly Price</p>
                <p className="font-semibold">${subscription?.monthlyPrice || 0}/month</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Commission Rate</p>
                <p className="font-semibold">{subscription?.commissionRate || 9}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Next Billing</p>
                <p className="font-semibold">
                  {subscription?.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLAN_DETAILS.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.name === subscription?.plan;
            const colorClasses: Record<string, { border: string; bg: string; text: string; icon: string }> = {
              purple: { border: "border-purple-300", bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
              rose: { border: "border-rose-300", bg: "bg-rose-50", text: "text-rose-600", icon: "text-rose-500" },
              gray: { border: "border-gray-300", bg: "bg-gray-50", text: "text-gray-600", icon: "text-gray-500" },
            };
            const colors = colorClasses[plan.color];

            return (
              <Card
                key={plan.name}
                className={`${colors.border} border-2 ${isCurrentPlan ? "ring-2 ring-rose-500" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`h-6 w-6 ${colors.icon}`} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {isCurrentPlan && (
                          <Badge className="bg-rose-100 text-rose-800">Current</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-slate-500">/month</span>
                    <p className={`text-sm font-medium ${colors.text} mt-1`}>
                      {plan.commission > 0 ? `${plan.commission}% commission` : "No commission"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!isCurrentPlan && (
                    <Button
                      className="w-full"
                      variant={plan.name === "PRO" ? "default" : "outline"}
                      onClick={() => handleUpgrade(plan.name)}
                    >
                      {plan.price > (subscription?.monthlyPrice || 0) ? "Upgrade" : "Switch"} to {plan.name}
                    </Button>
                  )}
                  {isCurrentPlan && (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
