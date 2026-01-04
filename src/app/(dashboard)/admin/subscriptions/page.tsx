"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Building2,
  Check,
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  monthlyPrice: number;
  billingCycle: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  business: {
    id: string;
    name: string;
    email: string | null;
  };
}

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isPlatformAdmin) {
      router.push("/dashboard");
      return;
    }

    if (status === "authenticated" && session?.user?.isPlatformAdmin) {
      fetchSubscriptions();
    }
  }, [session, status, router]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/admin/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filter === "all") return true;
    return sub.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Check className="h-4 w-4 text-green-600" />;
      case "TRIAL":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "PAST_DUE":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "TRIAL":
        return "bg-yellow-100 text-yellow-800";
      case "PAST_DUE":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const statusCounts = {
    all: subscriptions.length,
    ACTIVE: subscriptions.filter((s) => s.status === "ACTIVE").length,
    TRIAL: subscriptions.filter((s) => s.status === "TRIAL").length,
    PAST_DUE: subscriptions.filter((s) => s.status === "PAST_DUE").length,
    CANCELLED: subscriptions.filter((s) => s.status === "CANCELLED").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-slate-600">
          Manage all business subscriptions and billing
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setFilter("all")}
          className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
            filter === "all" ? "ring-2 ring-rose-500" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold text-slate-900">
                {statusCounts.all}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-slate-400" />
          </div>
        </div>

        <div
          onClick={() => setFilter("ACTIVE")}
          className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
            filter === "ACTIVE" ? "ring-2 ring-green-500" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {statusCounts.ACTIVE}
              </p>
            </div>
            <Check className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div
          onClick={() => setFilter("TRIAL")}
          className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
            filter === "TRIAL" ? "ring-2 ring-yellow-500" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Trial</p>
              <p className="text-2xl font-bold text-yellow-600">
                {statusCounts.TRIAL}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div
          onClick={() => setFilter("PAST_DUE")}
          className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
            filter === "PAST_DUE" ? "ring-2 ring-red-500" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Past Due</p>
              <p className="text-2xl font-bold text-red-600">
                {statusCounts.PAST_DUE}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Business
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Plan
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Price
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                Next Billing
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSubscriptions.map((sub) => (
              <tr
                key={sub.id}
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => router.push(`/admin/salons/${sub.business.id}`)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {sub.business.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {sub.business.email || "No email"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sub.plan === "PRO"
                        ? "bg-purple-100 text-purple-800"
                        : sub.plan === "GROWTH"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {sub.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      sub.status
                    )}`}
                  >
                    {getStatusIcon(sub.status)}
                    {sub.status}
                  </span>
                  {sub.trialEndsAt && sub.status === "TRIAL" && (
                    <p className="text-xs text-slate-500 mt-1">
                      Trial ends {new Date(sub.trialEndsAt).toLocaleDateString()}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">
                    ${Number(sub.monthlyPrice).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500">{sub.billingCycle}</p>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSubscriptions.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No subscriptions found
          </div>
        )}
      </div>
    </div>
  );
}
