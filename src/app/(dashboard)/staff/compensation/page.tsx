"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Download,
  Filter,
  CreditCard,
  Banknote,
  Award,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface StaffMember {
  id: string;
  displayName: string | null;
  photo: string | null;
  commissionPct: number | null;
  productCommissionPct: number | null;
  payType: string | null;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface CompensationData {
  staffId: string;
  totalCommissions: number;
  totalTips: number;
  totalEarnings: number;
  serviceCommissions: number;
  productCommissions: number;
  transactionCount: number;
}

interface TipSummary {
  method: string;
  total: number;
  count: number;
}

export default function StaffCompensationPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [period, setPeriod] = useState<string>("month");
  const [loading, setLoading] = useState(true);
  const [staffCompensation, setStaffCompensation] =
    useState<CompensationData | null>(null);
  const [tipsByMethod, setTipsByMethod] = useState<TipSummary[]>([]);
  const [dailyData, setDailyData] = useState<
    { date: string; commissions: number; tips: number }[]
  >([]);

  // Fetch staff list
  useEffect(() => {
    async function fetchStaff() {
      try {
        const res = await fetch("/api/staff");
        const data = await res.json();
        setStaff(data);
        if (data.length > 0 && !selectedStaffId) {
          setSelectedStaffId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
      }
    }
    fetchStaff();
  }, []);

  // Fetch compensation data when staff or period changes
  useEffect(() => {
    if (!selectedStaffId) return;

    async function fetchCompensation() {
      setLoading(true);
      try {
        const [commRes, tipsRes] = await Promise.all([
          fetch(`/api/commissions/staff/${selectedStaffId}?period=${period}`),
          fetch(`/api/tips/staff/${selectedStaffId}?period=${period}`),
        ]);

        const commData = await commRes.json();
        const tipsData = await tipsRes.json();

        // Combine data
        setStaffCompensation({
          staffId: selectedStaffId,
          totalCommissions: commData.summary?.totalCommissions || 0,
          totalTips: tipsData.summary?.totalTips || 0,
          totalEarnings: commData.summary?.totalEarnings || 0,
          serviceCommissions:
            commData.byType?.find((t: { type: string }) => t.type === "service")
              ?.totalCommissions || 0,
          productCommissions:
            commData.byType?.find((t: { type: string }) => t.type === "product")
              ?.totalCommissions || 0,
          transactionCount: commData.summary?.commissionCount || 0,
        });

        setTipsByMethod(tipsData.byMethod || []);

        // Combine daily data
        const commDaily = commData.dailyBreakdown || [];
        const tipsDaily = tipsData.dailyBreakdown || [];
        const allDates = new Set([
          ...commDaily.map((d: { date: string }) => d.date),
          ...tipsDaily.map((d: { date: string }) => d.date),
        ]);

        const combined = Array.from(allDates)
          .map((date) => ({
            date,
            commissions:
              commDaily.find((d: { date: string }) => d.date === date)?.total ||
              0,
            tips:
              tipsDaily.find((d: { date: string }) => d.date === date)?.total ||
              0,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setDailyData(combined);
      } catch (error) {
        console.error("Error fetching compensation:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCompensation();
  }, [selectedStaffId, period]);

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Staff Compensation
          </h1>
          <p className="mt-1 text-gray-500">
            Track tips, commissions, and earnings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => {
              if (!staffCompensation || !selectedStaff) {
                alert('Please select a staff member first');
                return;
              }
              const csvContent = [
                ['Staff Compensation Report'],
                [`Staff: ${selectedStaff.displayName || `${selectedStaff.user.firstName} ${selectedStaff.user.lastName}`}`],
                [`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`],
                [`Generated: ${new Date().toLocaleDateString()}`],
                [],
                ['Metric', 'Amount'],
                ['Total Earnings', formatCurrency(staffCompensation.totalEarnings)],
                ['Commissions', formatCurrency(staffCompensation.totalCommissions)],
                ['Service Commissions', formatCurrency(staffCompensation.serviceCommissions)],
                ['Product Commissions', formatCurrency(staffCompensation.productCommissions)],
                ['Tips', formatCurrency(staffCompensation.totalTips)],
                ['Transactions', staffCompensation.transactionCount.toString()],
              ].map(row => row.join(',')).join('\n');

              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `compensation-report-${selectedStaff.user.firstName}-${period}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm font-medium text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName || `${s.user.firstName} ${s.user.lastName}`}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex rounded-lg border border-gray-200 bg-white p-1">
          {["day", "week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Info Card */}
      {selectedStaff && (
        <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
              {selectedStaff.photo ? (
                <img
                  src={selectedStaff.photo}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                (selectedStaff.displayName ||
                  selectedStaff.user.firstName)[0].toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {selectedStaff.displayName ||
                  `${selectedStaff.user.firstName} ${selectedStaff.user.lastName}`}
              </h2>
              <p className="text-white/80">
                {selectedStaff.payType || "Commission"} •{" "}
                {selectedStaff.commissionPct || 50}% Service /{" "}
                {selectedStaff.productCommissionPct || 10}% Product
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <span className="flex items-center text-sm font-medium text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              12%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Total Earnings</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? "..." : formatCurrency(staffCompensation?.totalEarnings || 0)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Commissions</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading
                ? "..."
                : formatCurrency(staffCompensation?.totalCommissions || 0)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
              <Banknote className="h-6 w-6 text-pink-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Tips</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? "..." : formatCurrency(staffCompensation?.totalTips || 0)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Transactions</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? "..." : staffCompensation?.transactionCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Earnings Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Daily Earnings</h3>
          <p className="text-sm text-gray-500">Commissions & tips over time</p>

          <div className="mt-6 h-64">
            {dailyData.length > 0 ? (
              <div className="flex h-full items-end gap-2">
                {dailyData.slice(-14).map((day, i) => {
                  const maxValue = Math.max(
                    ...dailyData.map((d) => d.commissions + d.tips)
                  );
                  const height =
                    maxValue > 0
                      ? ((day.commissions + day.tips) / maxValue) * 100
                      : 0;
                  const commHeight =
                    maxValue > 0 ? (day.commissions / maxValue) * 100 : 0;

                  return (
                    <div
                      key={day.date}
                      className="group relative flex flex-1 flex-col items-center"
                    >
                      <div className="absolute -top-8 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                        {formatCurrency(day.commissions + day.tips)}
                      </div>
                      <div
                        className="relative w-full overflow-hidden rounded-t bg-pink-200"
                        style={{ height: `${height}%` }}
                      >
                        <div
                          className="absolute bottom-0 w-full bg-purple-500"
                          style={{ height: `${(commHeight / height) * 100}%` }}
                        />
                      </div>
                      <span className="mt-2 text-xs text-gray-500">
                        {formatDate(day.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No data for this period
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-purple-500" />
              <span className="text-sm text-gray-600">Commissions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-pink-200" />
              <span className="text-sm text-gray-600">Tips</span>
            </div>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Commission Breakdown
          </h3>
          <p className="text-sm text-gray-500">By service type</p>

          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Service Commissions
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(staffCompensation?.serviceCommissions || 0)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{
                    width: `${
                      staffCompensation?.totalCommissions
                        ? ((staffCompensation.serviceCommissions || 0) /
                            staffCompensation.totalCommissions) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Product Commissions
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(staffCompensation?.productCommissions || 0)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-pink-500"
                  style={{
                    width: `${
                      staffCompensation?.totalCommissions
                        ? ((staffCompensation.productCommissions || 0) /
                            staffCompensation.totalCommissions) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tips by Method */}
          <h4 className="mt-8 text-sm font-semibold text-gray-900">
            Tips by Payment Method
          </h4>
          <div className="mt-4 space-y-3">
            {tipsByMethod.length > 0 ? (
              tipsByMethod.map((tip) => (
                <div
                  key={tip.method}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    {tip.method === "CASH" ? (
                      <Banknote className="h-5 w-5 text-green-600" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {tip.method.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(tip.total)}
                    </p>
                    <p className="text-xs text-gray-500">{tip.count} tips</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-400">
                No tips recorded
              </p>
            )}
          </div>
        </div>
      </div>

      {/* All Staff Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          All Staff Summary
        </h3>
        <p className="text-sm text-gray-500">Commission rates and settings</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Staff Member
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Pay Type
                </th>
                <th className="pb-3 text-center text-sm font-medium text-gray-500">
                  Service %
                </th>
                <th className="pb-3 text-center text-sm font-medium text-gray-500">
                  Product %
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-medium text-purple-600">
                        {s.photo ? (
                          <img
                            src={s.photo}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          (s.displayName || s.user.firstName)[0].toUpperCase()
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {s.displayName ||
                          `${s.user.firstName} ${s.user.lastName}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                      {s.payType || "Commission"}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="font-medium text-gray-900">
                      {s.commissionPct || 50}%
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="font-medium text-gray-900">
                      {s.productCommissionPct || 10}%
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setSelectedStaffId(s.id)}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
