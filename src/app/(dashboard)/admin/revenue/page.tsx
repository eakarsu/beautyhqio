"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface RevenueStats {
  totalRevenue: number;
  subscriptionRevenue: number;
  commissionRevenue: number;
  previousMonthRevenue: number;
  revenueByPlan: Array<{
    plan: string;
    count: number;
    revenue: number;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    businessId: string;
    businessName: string;
    totalAmount: number;
    status: string;
    paidAt: string | null;
  }>;
}

export default function PlatformRevenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isPlatformAdmin) {
      router.push("/dashboard");
      return;
    }

    if (status === "authenticated" && session?.user?.isPlatformAdmin) {
      fetchRevenueStats();
    }
  }, [session, status, router]);

  const fetchRevenueStats = async () => {
    try {
      const response = await fetch("/api/admin/revenue");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching revenue stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const revenueChange = stats
    ? ((stats.totalRevenue - stats.previousMonthRevenue) /
        (stats.previousMonthRevenue || 1)) *
      100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Revenue</h1>
        <p className="text-slate-600">
          Track revenue from subscriptions and commissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div
          className="bg-white rounded-xl border p-6 cursor-pointer hover:border-green-300 hover:shadow-md transition-all"
          onClick={() => router.push("/admin/subscriptions")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${(stats?.totalRevenue || 0).toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {revenueChange >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <p
                  className={`text-xs ${
                    revenueChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.abs(revenueChange).toFixed(1)}% vs last month
                </p>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Subscription Revenue */}
        <div
          className="bg-white rounded-xl border p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
          onClick={() => router.push("/admin/subscriptions")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Subscription Revenue
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${(stats?.subscriptionRevenue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Monthly recurring</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Commission Revenue */}
        <div
          className="bg-white rounded-xl border p-6 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
          onClick={() => router.push("/admin/salons")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Commission Revenue
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${(stats?.commissionRevenue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">From marketplace</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Active Plans */}
        <div
          className="bg-white rounded-xl border p-6 cursor-pointer hover:border-rose-300 hover:shadow-md transition-all"
          onClick={() => router.push("/admin/subscriptions")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Plans</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.revenueByPlan?.reduce((sum, p) => sum + p.count, 0) || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Paid subscriptions</p>
            </div>
            <div className="h-12 w-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Revenue by Plan
          </h2>
          <div className="space-y-4">
            {stats?.revenueByPlan?.map((plan) => (
              <div key={plan.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      plan.plan === "PRO"
                        ? "bg-purple-500"
                        : plan.plan === "GROWTH"
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-slate-900">{plan.plan}</p>
                    <p className="text-sm text-slate-500">
                      {plan.count} subscribers
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-slate-900">
                  ${plan.revenue.toLocaleString()}/mo
                </p>
              </div>
            )) || (
              <p className="text-slate-500">No subscription data</p>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Invoices
          </h2>
          <div className="space-y-3">
            {stats?.recentInvoices?.length ? (
              stats.recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-slate-50 transition-colors rounded px-2 -mx-2"
                  onClick={() => router.push(`/admin/salons/${invoice.businessId}`)}
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {invoice.businessName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {invoice.invoiceNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">
                      ${Number(invoice.totalAmount).toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        invoice.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : invoice.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No invoices yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
