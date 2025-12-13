"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Scissors,
  BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RevenueReport {
  summary: {
    totalRevenue: number;
    totalTax: number;
    totalTips: number;
    totalDiscounts: number;
    serviceRevenue: number;
    productRevenue: number;
    transactionCount: number;
    averageTransaction: number;
  };
  timeSeries: Array<{ date: string; revenue: number; count: number }>;
}

interface ServiceReport {
  services: Array<{
    service: { id: string; name: string; category: string };
    bookings: { total: number; completed: number };
    revenue: number;
  }>;
  totals: {
    totalRevenue: number;
    totalBookings: number;
  };
}

interface StaffPerformanceItem {
  staff: {
    id: string;
    displayName?: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  appointments: {
    total: number;
    completed: number;
  };
  revenue: {
    total: number;
  };
}

interface StaffReport {
  staff: StaffPerformanceItem[];
}

export default function ReportsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState("this_month");
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null);
  const [serviceData, setServiceData] = useState<ServiceReport | null>(null);
  const [staffData, setStaffData] = useState<StaffReport | null>(null);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (dateRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "this_week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "this_quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      try {
        const { startDate, endDate } = getDateRange();

        // Fetch all reports in parallel
        const [revenueRes, serviceRes, staffRes] = await Promise.all([
          fetch(`/api/reports/revenue?startDate=${startDate}&endDate=${endDate}`),
          fetch(`/api/reports/services?startDate=${startDate}&endDate=${endDate}`),
          fetch(`/api/reports/staff-performance?startDate=${startDate}&endDate=${endDate}`),
        ]);

        if (revenueRes.ok) {
          setRevenueData(await revenueRes.json());
        }
        if (serviceRes.ok) {
          setServiceData(await serviceRes.json());
        }
        if (staffRes.ok) {
          setStaffData(await staffRes.json());
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, [dateRange]);

  const TrendIcon = ({ trend }: { trend: string }) =>
    trend === "up" ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );

  // Get top 5 services by revenue
  const topServices = serviceData?.services.slice(0, 5) || [];

  // Get top 5 staff by revenue
  const topStaff = staffData?.staff?.slice(0, 5) || [];

  // Get daily revenue (last 7 days from time series)
  const dailyRevenue = revenueData?.timeSeries.slice(-7) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">
            Analytics and business insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => router.push("/reports/builder")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading reports...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/pos")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <TrendIcon trend="up" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(revenueData?.summary.totalRevenue || 0)}
                </p>
                <p className="text-xs text-slate-500">Revenue</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/pos")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <TrendIcon trend="up" />
                </div>
                <p className="text-2xl font-bold">{revenueData?.summary.transactionCount || 0}</p>
                <p className="text-xs text-slate-500">Transactions</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/services")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Scissors className="h-4 w-4 text-slate-400" />
                  <TrendIcon trend="up" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(revenueData?.summary.serviceRevenue || 0)}
                </p>
                <p className="text-xs text-slate-500">Service Revenue</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/products")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                  <TrendIcon trend="up" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(revenueData?.summary.productRevenue || 0)}
                </p>
                <p className="text-xs text-slate-500">Product Revenue</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/pos")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <TrendIcon trend="up" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(revenueData?.summary.averageTransaction || 0)}
                </p>
                <p className="text-xs text-slate-500">Avg Transaction</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/staff/compensation")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <TrendIcon trend="up" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(revenueData?.summary.totalTips || 0)}
                </p>
                <p className="text-xs text-slate-500">Tips</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyRevenue.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No data for this period</div>
                ) : (
                  <div className="space-y-3">
                    {dailyRevenue.map((day) => {
                      const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue));
                      return (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="w-20 text-sm text-slate-500">{new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                          <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-lg"
                              style={{
                                width: maxRevenue > 0 ? `${(day.revenue / maxRevenue) * 100}%` : "0%",
                              }}
                            />
                          </div>
                          <span className="w-24 text-sm font-medium text-right">
                            {formatCurrency(day.revenue)}
                          </span>
                          <span className="w-16 text-xs text-slate-500 text-right">
                            {day.count} txns
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Services</CardTitle>
              </CardHeader>
              <CardContent>
                {topServices.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No services data</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topServices.map((item, idx) => (
                        <TableRow key={item.service.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                                {idx + 1}
                              </Badge>
                              {item.service.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.bookings.completed}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Staff Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Staff Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {topStaff.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No staff data available</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead className="text-right">Appointments</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topStaff.map((item) => {
                      const staffName = item.staff.displayName ||
                        (item.staff.user ? `${item.staff.user.firstName} ${item.staff.user.lastName}` : 'Unknown');
                      return (
                        <TableRow key={item.staff.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/staff/${item.staff.id}`)}>
                          <TableCell className="font-medium">{staffName}</TableCell>
                          <TableCell className="text-right">
                            {item.appointments.total}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.revenue.total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
