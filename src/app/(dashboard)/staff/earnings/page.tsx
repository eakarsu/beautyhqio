"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Clock } from "lucide-react";

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  thisWeek: number;
  completedAppointments: number;
  averagePerAppointment: number;
  recentTransactions: Array<{
    id: string;
    date: string;
    service: string;
    amount: number;
    client: string;
  }>;
}

export default function MyEarningsPage() {
  const { data: session } = useSession();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyEarnings();
  }, []);

  const fetchMyEarnings = async () => {
    try {
      const response = await fetch("/api/staff/me/earnings");
      if (response.ok) {
        const data = await response.json();
        setEarnings(data);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      </div>
    );
  }

  const data = earnings || {
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    thisWeek: 0,
    completedAppointments: 0,
    averagePerAppointment: 0,
    recentTransactions: [],
  };

  const monthChange = data.lastMonth > 0
    ? ((data.thisMonth - data.lastMonth) / data.lastMonth * 100).toFixed(1)
    : "0";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Earnings</h1>
        <p className="text-muted-foreground">Track your commissions and earnings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">${data.thisMonth.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Number(monthChange) >= 0 ? "+" : ""}{monthChange}% vs last month
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">${data.thisWeek.toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="text-2xl font-bold">{data.completedAppointments}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed this month</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg per Appointment</p>
                <p className="text-2xl font-bold">${data.averagePerAppointment.toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
          <CardDescription>Your latest completed services</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No earnings recorded yet</p>
              <p className="text-sm mt-1">Complete appointments to see your earnings here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{tx.service}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.client} - {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">+${tx.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
