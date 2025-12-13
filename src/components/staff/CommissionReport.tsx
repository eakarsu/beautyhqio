"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  ChevronDown,
  User,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface CommissionEntry {
  id: string;
  date: string;
  clientName: string;
  serviceName: string;
  serviceTotal: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "paid";
}

interface StaffCommission {
  staffId: string;
  staffName: string;
  totalServices: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  commissionRate: number;
  entries: CommissionEntry[];
}

interface CommissionReportProps {
  staffId?: string;
  showAllStaff?: boolean;
}

export function CommissionReport({ staffId, showAllStaff = false }: CommissionReportProps) {
  const [commissions, setCommissions] = useState<StaffCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [expandedStaff, setExpandedStaff] = useState<string | null>(staffId || null);

  useEffect(() => {
    fetchCommissions();
  }, [staffId, selectedPeriod]);

  const fetchCommissions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ period: selectedPeriod });
      if (staffId) params.append("staffId", staffId);

      const response = await fetch(`/api/reports/commissions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCommissions(data);
      }
    } catch (error) {
      console.error("Error fetching commissions:", error);
      // Demo data
      setCommissions([
        {
          staffId: "s1",
          staffName: "Sarah Johnson",
          totalServices: 45,
          totalRevenue: 3250.0,
          totalCommission: 975.0,
          pendingCommission: 325.0,
          paidCommission: 650.0,
          commissionRate: 30,
          entries: [
            {
              id: "e1",
              date: new Date().toISOString(),
              clientName: "Jane Doe",
              serviceName: "Haircut & Style",
              serviceTotal: 85.0,
              commissionRate: 30,
              commissionAmount: 25.5,
              status: "pending",
            },
            {
              id: "e2",
              date: new Date(Date.now() - 86400000).toISOString(),
              clientName: "John Smith",
              serviceName: "Color Treatment",
              serviceTotal: 150.0,
              commissionRate: 30,
              commissionAmount: 45.0,
              status: "pending",
            },
            {
              id: "e3",
              date: new Date(Date.now() - 172800000).toISOString(),
              clientName: "Emily Chen",
              serviceName: "Highlights",
              serviceTotal: 200.0,
              commissionRate: 30,
              commissionAmount: 60.0,
              status: "paid",
            },
          ],
        },
        {
          staffId: "s2",
          staffName: "Mike Brown",
          totalServices: 38,
          totalRevenue: 2890.0,
          totalCommission: 867.0,
          pendingCommission: 289.0,
          paidCommission: 578.0,
          commissionRate: 30,
          entries: [
            {
              id: "e4",
              date: new Date().toISOString(),
              clientName: "Alex Wilson",
              serviceName: "Men's Haircut",
              serviceTotal: 45.0,
              commissionRate: 30,
              commissionAmount: 13.5,
              status: "pending",
            },
          ],
        },
        {
          staffId: "s3",
          staffName: "Lisa Williams",
          totalServices: 52,
          totalRevenue: 4120.0,
          totalCommission: 1236.0,
          pendingCommission: 412.0,
          paidCommission: 824.0,
          commissionRate: 30,
          entries: [
            {
              id: "e5",
              date: new Date().toISOString(),
              clientName: "Maria Garcia",
              serviceName: "Full Color",
              serviceTotal: 180.0,
              commissionRate: 30,
              commissionAmount: 54.0,
              status: "pending",
            },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // Generate CSV
    const headers = ["Staff", "Date", "Client", "Service", "Revenue", "Rate", "Commission", "Status"];
    const rows = commissions.flatMap((staff) =>
      staff.entries.map((entry) => [
        staff.staffName,
        format(new Date(entry.date), "yyyy-MM-dd"),
        entry.clientName,
        entry.serviceName,
        entry.serviceTotal.toFixed(2),
        `${entry.commissionRate}%`,
        entry.commissionAmount.toFixed(2),
        entry.status,
      ])
    );

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commission-report-${selectedPeriod}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalCommission = commissions.reduce((sum, s) => sum + s.totalCommission, 0);
  const totalPending = commissions.reduce((sum, s) => sum + s.pendingCommission, 0);
  const totalRevenue = commissions.reduce((sum, s) => sum + s.totalRevenue, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Commission Report
            </CardTitle>
            <CardDescription>Track earnings and commission payouts</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">This Month</SelectItem>
                <SelectItem value="last">Last Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading commission data...
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {showAllStaff && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                    <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Total Commission</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${totalCommission.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Pending Payout</div>
                    <div className="text-2xl font-bold text-orange-600">
                      ${totalPending.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Staff Commission List */}
            <div className="space-y-4">
              {commissions.map((staff) => (
                <div key={staff.staffId} className="border rounded-lg overflow-hidden">
                  {/* Staff Header */}
                  <div
                    className="p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpandedStaff(expandedStaff === staff.staffId ? null : staff.staffId)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{staff.staffName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {staff.totalServices} services · {staff.commissionRate}% rate
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Revenue</div>
                          <div className="font-medium">${staff.totalRevenue.toFixed(2)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Commission</div>
                          <div className="font-medium text-green-600">
                            ${staff.totalCommission.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Pending</div>
                          <div className="font-medium text-orange-600">
                            ${staff.pendingCommission.toFixed(2)}
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            expandedStaff === staff.staffId ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Paid: ${staff.paidCommission.toFixed(2)}</span>
                        <span>Pending: ${staff.pendingCommission.toFixed(2)}</span>
                      </div>
                      <Progress
                        value={(staff.paidCommission / staff.totalCommission) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedStaff === staff.staffId && (
                    <div className="border-t">
                      <table className="w-full">
                        <thead className="bg-muted/20">
                          <tr className="text-xs text-muted-foreground">
                            <th className="text-left p-3">Date</th>
                            <th className="text-left p-3">Client</th>
                            <th className="text-left p-3">Service</th>
                            <th className="text-right p-3">Revenue</th>
                            <th className="text-right p-3">Commission</th>
                            <th className="text-center p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staff.entries.map((entry) => (
                            <tr key={entry.id} className="border-t">
                              <td className="p-3 text-sm">
                                {format(new Date(entry.date), "MMM d")}
                              </td>
                              <td className="p-3 text-sm">{entry.clientName}</td>
                              <td className="p-3 text-sm">{entry.serviceName}</td>
                              <td className="p-3 text-sm text-right">
                                ${entry.serviceTotal.toFixed(2)}
                              </td>
                              <td className="p-3 text-sm text-right font-medium text-green-600">
                                ${entry.commissionAmount.toFixed(2)}
                              </td>
                              <td className="p-3 text-center">
                                <Badge
                                  variant={entry.status === "paid" ? "default" : "secondary"}
                                  className={
                                    entry.status === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-orange-100 text-orange-800"
                                  }
                                >
                                  {entry.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
