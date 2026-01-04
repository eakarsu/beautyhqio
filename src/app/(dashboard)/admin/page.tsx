"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface PlatformStats {
  totalSalons: number;
  activeSalons: number;
  totalUsers: number;
  totalClients: number;
  monthlyRevenue: number;
  previousMonthRevenue: number;
  totalSubscriptions: number;
  trialSubscriptions: number;
  recentSalons: Array<{
    id: string;
    name: string;
    type: string;
    createdAt: string;
    subscription?: {
      plan: string;
      status: string;
    };
  }>;
}

export default function PlatformAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect non-platform-admins
    if (status === "authenticated" && !session?.user?.isPlatformAdmin) {
      router.push("/dashboard");
      return;
    }

    if (status === "authenticated" && session?.user?.isPlatformAdmin) {
      fetchPlatformStats();
    }
  }, [session, status, router]);

  const fetchPlatformStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching platform stats:", error);
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

  if (!session?.user?.isPlatformAdmin) {
    return null;
  }

  const revenueChange = stats
    ? ((stats.monthlyRevenue - stats.previousMonthRevenue) / (stats.previousMonthRevenue || 1)) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-600">
          Welcome back! Here&apos;s what&apos;s happening across all salons.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Salons */}
        <div
          className="bg-white rounded-xl border p-6 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
          onClick={() => router.push("/admin/salons")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Salons</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.totalSalons || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stats?.activeSalons || 0} active
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div
          className="bg-white rounded-xl border p-6 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
          onClick={() => router.push("/admin/salons")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.totalUsers || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Across all salons
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div
          className="bg-white rounded-xl border p-6 cursor-pointer hover:border-green-300 hover:shadow-md transition-all"
          onClick={() => router.push("/admin/revenue")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${(stats?.monthlyRevenue || 0).toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {revenueChange >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <p className={`text-xs ${revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(revenueChange).toFixed(1)}% vs last month
                </p>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Subscriptions */}
        <div
          className="bg-white rounded-xl border p-6 cursor-pointer hover:border-rose-300 hover:shadow-md transition-all"
          onClick={() => router.push("/admin/subscriptions")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Subscriptions</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.totalSubscriptions || 0}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {stats?.trialSubscriptions || 0} on trial
              </p>
            </div>
            <div className="h-12 w-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Salons */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Salons</h2>
            <button
              onClick={() => router.push("/admin/salons")}
              className="text-sm text-rose-600 hover:text-rose-700 font-medium"
            >
              View all
            </button>
          </div>
        </div>
        <div className="divide-y">
          {stats?.recentSalons?.length ? (
            stats.recentSalons.map((salon) => (
              <div key={salon.id} className="p-4 hover:bg-slate-50 cursor-pointer"
                onClick={() => router.push(`/admin/salons/${salon.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{salon.name}</p>
                    <p className="text-sm text-slate-500">{salon.type.replace("_", " ")}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      salon.subscription?.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : salon.subscription?.status === "TRIAL"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {salon.subscription?.plan || "No Plan"} - {salon.subscription?.status || "N/A"}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(salon.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500">
              No salons registered yet
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => router.push("/admin/salons")}
          className="bg-white rounded-xl border p-6 text-left hover:border-rose-200 transition-colors"
        >
          <Building2 className="h-8 w-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Manage Salons</h3>
          <p className="text-sm text-slate-500 mt-1">
            View and manage all registered salons
          </p>
        </button>

        <button
          onClick={() => router.push("/admin/revenue")}
          className="bg-white rounded-xl border p-6 text-left hover:border-rose-200 transition-colors"
        >
          <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Revenue Reports</h3>
          <p className="text-sm text-slate-500 mt-1">
            View platform revenue and analytics
          </p>
        </button>

        <button
          onClick={() => router.push("/admin/subscriptions")}
          className="bg-white rounded-xl border p-6 text-left hover:border-rose-200 transition-colors"
        >
          <CreditCard className="h-8 w-8 text-rose-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Subscriptions</h3>
          <p className="text-sm text-slate-500 mt-1">
            Manage subscription plans and billing
          </p>
        </button>
      </div>
    </div>
  );
}
