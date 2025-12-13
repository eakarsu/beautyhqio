"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface WidgetData {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
}

interface DashboardWidgetsProps {
  period?: "today" | "week" | "month" | "year";
}

export function DashboardWidgets({ period = "month" }: DashboardWidgetsProps) {
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/dashboard?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setWidgets(formatWidgets(data));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Demo data
      setWidgets([
        {
          label: "Total Revenue",
          value: "$24,580",
          change: 12.5,
          changeLabel: "vs last period",
          icon: <DollarSign className="h-5 w-5" />,
          color: "bg-green-100 text-green-600",
        },
        {
          label: "Appointments",
          value: 342,
          change: 8.3,
          changeLabel: "vs last period",
          icon: <Calendar className="h-5 w-5" />,
          color: "bg-blue-100 text-blue-600",
        },
        {
          label: "New Clients",
          value: 48,
          change: 15.2,
          changeLabel: "vs last period",
          icon: <Users className="h-5 w-5" />,
          color: "bg-purple-100 text-purple-600",
        },
        {
          label: "Avg Ticket",
          value: "$71.87",
          change: -2.4,
          changeLabel: "vs last period",
          icon: <ShoppingBag className="h-5 w-5" />,
          color: "bg-orange-100 text-orange-600",
        },
        {
          label: "Utilization",
          value: "78%",
          change: 5.1,
          changeLabel: "vs last period",
          icon: <Clock className="h-5 w-5" />,
          color: "bg-cyan-100 text-cyan-600",
        },
        {
          label: "Avg Rating",
          value: "4.8",
          change: 0.2,
          changeLabel: "vs last period",
          icon: <Star className="h-5 w-5" />,
          color: "bg-yellow-100 text-yellow-600",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatWidgets = (data: Record<string, unknown>): WidgetData[] => {
    return [
      {
        label: "Total Revenue",
        value: `$${(data.revenue as number)?.toLocaleString() || 0}`,
        change: data.revenueChange as number,
        changeLabel: "vs last period",
        icon: <DollarSign className="h-5 w-5" />,
        color: "bg-green-100 text-green-600",
      },
      {
        label: "Appointments",
        value: data.appointments as number || 0,
        change: data.appointmentsChange as number,
        changeLabel: "vs last period",
        icon: <Calendar className="h-5 w-5" />,
        color: "bg-blue-100 text-blue-600",
      },
      {
        label: "New Clients",
        value: data.newClients as number || 0,
        change: data.newClientsChange as number,
        changeLabel: "vs last period",
        icon: <Users className="h-5 w-5" />,
        color: "bg-purple-100 text-purple-600",
      },
      {
        label: "Avg Ticket",
        value: `$${(data.avgTicket as number)?.toFixed(2) || "0.00"}`,
        change: data.avgTicketChange as number,
        changeLabel: "vs last period",
        icon: <ShoppingBag className="h-5 w-5" />,
        color: "bg-orange-100 text-orange-600",
      },
    ];
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-4">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {widgets.map((widget, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${widget.color}`}>
                {widget.icon}
              </div>
              {widget.change !== undefined && (
                <div
                  className={`flex items-center gap-1 text-xs ${
                    widget.change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {widget.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(widget.change)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold">{widget.value}</div>
            <div className="text-xs text-muted-foreground">{widget.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Individual Widget Components for flexibility
export function RevenueWidget({ value, change }: { value: number; change?: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-green-100 text-green-600">
            <DollarSign className="h-5 w-5" />
          </div>
          {change !== undefined && (
            <Badge
              variant="secondary"
              className={change >= 0 ? "text-green-600" : "text-red-600"}
            >
              {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold">${value.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">Total Revenue</div>
      </CardContent>
    </Card>
  );
}

export function AppointmentsWidget({ value, change }: { value: number; change?: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Calendar className="h-5 w-5" />
          </div>
          {change !== undefined && (
            <Badge
              variant="secondary"
              className={change >= 0 ? "text-green-600" : "text-red-600"}
            >
              {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">Appointments</div>
      </CardContent>
    </Card>
  );
}

export function ClientsWidget({ value, change }: { value: number; change?: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
            <Users className="h-5 w-5" />
          </div>
          {change !== undefined && (
            <Badge
              variant="secondary"
              className={change >= 0 ? "text-green-600" : "text-red-600"}
            >
              {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">New Clients</div>
      </CardContent>
    </Card>
  );
}
