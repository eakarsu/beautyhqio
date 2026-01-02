"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Gift,
  Star,
  Info,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";

interface DashboardData {
  stats: {
    todayAppointments: number;
    appointmentChange: string;
    todayRevenue: number;
    revenueChange: string;
    walkInQueue: number;
    avgWaitTime: string;
    staffOnDuty: number;
    totalClients: number;
  };
  appointments: Array<{
    id: string;
    time: string;
    client: string;
    clientId: string | null;
    service: string;
    staff: string;
    staffId: string;
    status: string;
  }>;
  recentClients: Array<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    status: string;
    createdAt: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    href: string;
  }>;
}

const alertIcons: Record<string, React.ElementType> = {
  inventory: AlertCircle,
  birthday: Gift,
  review: Star,
  info: Info,
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect based on user role
    if (status === "authenticated") {
      if (session?.user?.isPlatformAdmin) {
        router.replace("/admin");
        return;
      }
      if (session?.user?.isClient) {
        router.replace("/client");
        return;
      }
      // Staff should go to their own portal, not the salon-wide dashboard
      if (session?.user?.role === "STAFF") {
        router.replace("/staff/schedule");
        return;
      }
      fetchDashboardData();
    }
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAppointment = () => router.push("/calendar");
  const handleWalkIn = () => router.push("/calendar/waitlist");
  const handleQuickSale = () => router.push("/pos");
  const handleNewClient = () => router.push("/clients/new");

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in-service":
      case "in-progress":
        return "warning";
      case "checked-in":
        return "default";
      case "cancelled":
      case "no-show":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getClientStatusVariant = (status: string) => {
    switch (status) {
      case "vip":
        return "default";
      case "active":
        return "success";
      case "inactive":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(timeString), "h:mm a");
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-96 bg-slate-200 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    todayAppointments: 0,
    appointmentChange: "No data",
    todayRevenue: 0,
    revenueChange: "No data",
    walkInQueue: 0,
    avgWaitTime: "No wait",
    staffOnDuty: 0,
    totalClients: 0,
  };

  const statCards = [
    {
      title: "Today's Appointments",
      value: stats.todayAppointments.toString(),
      change: stats.appointmentChange,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      href: "/calendar",
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayRevenue.toLocaleString()}`,
      change: stats.revenueChange,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      href: "/reports",
    },
    {
      title: "Total Clients",
      value: stats.totalClients.toString(),
      change: "All time",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/clients",
    },
    {
      title: "Walk-in Queue",
      value: stats.walkInQueue.toString(),
      change: stats.avgWaitTime,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      href: "/calendar/waitlist",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Good morning, {session?.user?.firstName || "there"}!
        </h1>
        <p className="text-slate-500 mt-1">
          Here&apos;s what&apos;s happening at your salon today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(stat.href)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.appointments && dashboardData.appointments.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {dashboardData.appointments.slice(0, 8).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/appointments/${apt.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium text-slate-500 w-20">
                        {formatTime(apt.time)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{apt.client}</p>
                        <p className="text-sm text-slate-500">{apt.service} with {apt.staff}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(apt.status)}>
                      {apt.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No appointments scheduled for today</p>
                <button
                  onClick={handleNewAppointment}
                  className="mt-3 text-rose-600 hover:text-rose-700 text-sm font-medium"
                >
                  Book an appointment
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.alerts && dashboardData.alerts.length > 0 ? (
                dashboardData.alerts.map((alert, idx) => {
                  const AlertIcon = alertIcons[alert.type] || Info;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => router.push(alert.href)}
                    >
                      <AlertIcon className="h-5 w-5 text-rose-500 mt-0.5" />
                      <p className="text-sm text-slate-600">{alert.message}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <p className="text-sm">No new alerts</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-slate-900 mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleNewAppointment}
                  className="p-3 text-sm bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  New Appointment
                </button>
                <button
                  onClick={handleWalkIn}
                  className="p-3 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Walk-in
                </button>
                <button
                  onClick={handleQuickSale}
                  className="p-3 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Quick Sale
                </button>
                <button
                  onClick={handleNewClient}
                  className="p-3 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  New Client
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Clients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">All Clients ({dashboardData?.recentClients?.length || 0})</CardTitle>
          <button
            onClick={() => router.push("/clients")}
            className="text-sm text-rose-600 hover:text-rose-700 font-medium"
          >
            Manage Clients
          </button>
        </CardHeader>
        <CardContent>
          {dashboardData?.recentClients && dashboardData.recentClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dashboardData.recentClients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                      <span className="text-rose-600 font-medium text-sm">
                        {client.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{client.name}</p>
                      <p className="text-xs text-slate-500 truncate">{client.phone}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant={getClientStatusVariant(client.status)} className="text-xs">
                      {client.status}
                    </Badge>
                    <span className="text-xs text-slate-400">{formatDate(client.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <UserPlus className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No clients yet</p>
              <button
                onClick={handleNewClient}
                className="mt-3 text-rose-600 hover:text-rose-700 text-sm font-medium"
              >
                Add your first client
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
