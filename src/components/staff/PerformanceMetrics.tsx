"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Star,
  DollarSign,
  Calendar,
  Target,
  Award,
  BarChart3,
} from "lucide-react";

interface PerformanceData {
  staffId: string;
  staffName: string;
  metrics: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShows: number;
    totalRevenue: number;
    avgTicket: number;
    clientRetention: number;
    newClients: number;
    avgRating: number;
    totalReviews: number;
    utilizationRate: number;
    avgServiceTime: number;
    onTimeRate: number;
    rebookingRate: number;
  };
  trends: {
    revenue: number;
    appointments: number;
    rating: number;
  };
  goals?: {
    revenueGoal: number;
    appointmentGoal: number;
    newClientGoal: number;
  };
}

interface PerformanceMetricsProps {
  staffId: string;
  period?: string;
}

export function PerformanceMetrics({ staffId, period = "month" }: PerformanceMetricsProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    fetchMetrics();
  }, [staffId, selectedPeriod]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/staff/${staffId}/performance?period=${selectedPeriod}`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
      // Demo data
      setData({
        staffId,
        staffName: "Sarah Johnson",
        metrics: {
          totalAppointments: 145,
          completedAppointments: 138,
          cancelledAppointments: 5,
          noShows: 2,
          totalRevenue: 12500.0,
          avgTicket: 90.58,
          clientRetention: 78,
          newClients: 23,
          avgRating: 4.8,
          totalReviews: 42,
          utilizationRate: 82,
          avgServiceTime: 65,
          onTimeRate: 94,
          rebookingRate: 65,
        },
        trends: {
          revenue: 12,
          appointments: 8,
          rating: 2,
        },
        goals: {
          revenueGoal: 15000,
          appointmentGoal: 160,
          newClientGoal: 30,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading performance metrics...
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No performance data available
        </CardContent>
      </Card>
    );
  }

  const { metrics, trends, goals } = data;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Dashboard
        </h2>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div className={`flex items-center gap-1 ${getTrendColor(trends.revenue)}`}>
                {getTrendIcon(trends.revenue)}
                <span className="text-sm">{Math.abs(trends.revenue)}%</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div className={`flex items-center gap-1 ${getTrendColor(trends.appointments)}`}>
                {getTrendIcon(trends.appointments)}
                <span className="text-sm">{Math.abs(trends.appointments)}%</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{metrics.completedAppointments}</div>
              <div className="text-sm text-muted-foreground">Appointments</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Star className="h-5 w-5 text-yellow-500" />
              <div className={`flex items-center gap-1 ${getTrendColor(trends.rating)}`}>
                {getTrendIcon(trends.rating)}
                <span className="text-sm">{Math.abs(trends.rating)}%</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{metrics.avgRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">
                Avg Rating ({metrics.totalReviews} reviews)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-purple-600" />
              <Badge variant="secondary">{metrics.newClients} new</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{metrics.clientRetention}%</div>
              <div className="text-sm text-muted-foreground">Client Retention</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      {goals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Monthly Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Revenue Goal</span>
                <span className="text-sm text-muted-foreground">
                  ${metrics.totalRevenue.toLocaleString()} / ${goals.revenueGoal.toLocaleString()}
                </span>
              </div>
              <Progress
                value={(metrics.totalRevenue / goals.revenueGoal) * 100}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {((metrics.totalRevenue / goals.revenueGoal) * 100).toFixed(0)}% achieved
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Appointment Goal</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.completedAppointments} / {goals.appointmentGoal}
                </span>
              </div>
              <Progress
                value={(metrics.completedAppointments / goals.appointmentGoal) * 100}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {((metrics.completedAppointments / goals.appointmentGoal) * 100).toFixed(0)}% achieved
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">New Client Goal</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.newClients} / {goals.newClientGoal}
                </span>
              </div>
              <Progress
                value={(metrics.newClients / goals.newClientGoal) * 100}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {((metrics.newClients / goals.newClientGoal) * 100).toFixed(0)}% achieved
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appointment Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Scheduled</span>
                <span className="font-medium">{metrics.totalAppointments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed</span>
                <span className="font-medium text-green-600">{metrics.completedAppointments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cancelled</span>
                <span className="font-medium text-orange-600">{metrics.cancelledAppointments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">No Shows</span>
                <span className="font-medium text-red-600">{metrics.noShows}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm">Completion Rate</span>
                <span className="font-medium">
                  {((metrics.completedAppointments / metrics.totalAppointments) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Efficiency Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Utilization Rate</span>
                <div className="flex items-center gap-2">
                  <Progress value={metrics.utilizationRate} className="w-20 h-2" />
                  <span className="font-medium">{metrics.utilizationRate}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">On-Time Rate</span>
                <div className="flex items-center gap-2">
                  <Progress value={metrics.onTimeRate} className="w-20 h-2" />
                  <span className="font-medium">{metrics.onTimeRate}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Rebooking Rate</span>
                <div className="flex items-center gap-2">
                  <Progress value={metrics.rebookingRate} className="w-20 h-2" />
                  <span className="font-medium">{metrics.rebookingRate}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg Service Time</span>
                <span className="font-medium">{metrics.avgServiceTime} min</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm">Avg Ticket</span>
                <span className="font-medium">${metrics.avgTicket.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {metrics.avgRating >= 4.8 && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                Top Rated
              </Badge>
            )}
            {metrics.clientRetention >= 75 && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                <Users className="h-3 w-3 mr-1" />
                Client Favorite
              </Badge>
            )}
            {metrics.onTimeRate >= 95 && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <Clock className="h-3 w-3 mr-1" />
                Punctual Pro
              </Badge>
            )}
            {metrics.rebookingRate >= 60 && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                <Calendar className="h-3 w-3 mr-1" />
                Rebooking Star
              </Badge>
            )}
            {trends.revenue >= 10 && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                <TrendingUp className="h-3 w-3 mr-1" />
                Revenue Growth
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
