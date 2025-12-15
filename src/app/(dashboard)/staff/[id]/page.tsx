"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  Users,
  Edit,
  Mail,
  Phone,
  Briefcase,
  Banknote,
} from "lucide-react";
import { format } from "date-fns";
import StaffPayouts from "@/components/staff/StaffPayouts";

interface Staff {
  id: string;
  displayName?: string;
  title?: string;
  bio?: string;
  photo?: string;
  color?: string;
  specialties: string[];
  employmentType: string;
  hireDate?: string;
  avgRating?: number;
  reviewCount: number;
  rebookRate?: number;
  isActive: boolean;
  stripeAccountId?: string;
  stripeAccountStatus?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

interface StaffStats {
  appointmentsToday: number;
  appointmentsWeek: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  clientsServed: number;
  avgServiceTime: number;
}

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, [id]);

  const fetchStaff = async () => {
    try {
      const [staffRes, statsRes] = await Promise.all([
        fetch(`/api/staff/${id}`),
        fetch(`/api/reports/staff-performance?staffId=${id}`),
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayName = () => {
    if (staff?.displayName) return staff.displayName;
    return `${staff?.user.firstName} ${staff?.user.lastName}`;
  };

  const getInitials = () => {
    if (staff?.user) {
      return `${staff.user.firstName[0]}${staff.user.lastName[0]}`;
    }
    return "??";
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading staff profile...</div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Staff Member Not Found</h2>
          <Button className="mt-4" onClick={() => router.push("/staff")}>
            Back to Staff
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Staff Profile</h1>
        </div>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:row-span-2">
          <CardContent className="pt-6">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={staff.photo || ""} alt={getDisplayName()} />
                <AvatarFallback
                  className="text-2xl"
                  style={{ backgroundColor: staff.color || "#f43f5e" }}
                >
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{getDisplayName()}</h2>
              {staff.title && (
                <p className="text-muted-foreground">{staff.title}</p>
              )}
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant={staff.isActive ? "default" : "secondary"}>
                  {staff.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">{staff.employmentType}</Badge>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {staff.user.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.user.email}</span>
                </div>
              )}
              {staff.user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.user.phone}</span>
                </div>
              )}
              {staff.hireDate && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>Hired {format(new Date(staff.hireDate), "MMMM yyyy")}</span>
                </div>
              )}
            </div>

            {staff.bio && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">About</h3>
                <p className="text-sm text-muted-foreground">{staff.bio}</p>
              </div>
            )}

            {staff.specialties.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {staff.specialties.map((specialty, i) => (
                    <Badge key={i} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Star className="h-4 w-4" />
                <span className="text-sm">Rating</span>
              </div>
              <div className="text-2xl font-bold">
                {staff.avgRating ? Number(staff.avgRating).toFixed(1) : "N/A"}
              </div>
              <div className="text-xs text-muted-foreground">
                {staff.reviewCount} reviews
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Rebook Rate</span>
              </div>
              <div className="text-2xl font-bold">
                {staff.rebookRate ? `${Number(staff.rebookRate).toFixed(0)}%` : "N/A"}
              </div>
              <div className="text-xs text-muted-foreground">Client retention</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Today</span>
              </div>
              <div className="text-2xl font-bold">{stats?.appointmentsToday || 0}</div>
              <div className="text-xs text-muted-foreground">appointments</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Revenue</span>
              </div>
              <div className="text-2xl font-bold">
                ${(stats?.revenueMonth || 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">this month</div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Tabs */}
        <Card className="md:col-span-2">
          <Tabs defaultValue="performance">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="commissions">Commissions</TabsTrigger>
                <TabsTrigger value="payouts" className="flex items-center gap-1">
                  <Banknote className="h-3 w-3" />
                  Payouts
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="performance" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Client Satisfaction</span>
                    <span className="text-sm text-muted-foreground">
                      {staff.avgRating ? `${Number(staff.avgRating).toFixed(1)}/5` : "N/A"}
                    </span>
                  </div>
                  <Progress
                    value={staff.avgRating ? (Number(staff.avgRating) / 5) * 100 : 0}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Rebook Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {staff.rebookRate ? `${Number(staff.rebookRate).toFixed(0)}%` : "N/A"}
                    </span>
                  </div>
                  <Progress value={Number(staff.rebookRate) || 0} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats?.clientsServed || 0}</div>
                    <div className="text-xs text-muted-foreground">Clients Served</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats?.appointmentsWeek || 0}</div>
                    <div className="text-xs text-muted-foreground">This Week</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats?.avgServiceTime || 0} min</div>
                    <div className="text-xs text-muted-foreground">Avg Service Time</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schedule">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Schedule editor coming soon</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => router.push(`/staff/${id}/schedule`)}
                  >
                    Manage Schedule
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="commissions">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">Today&apos;s Earnings</div>
                      <div className="text-sm text-muted-foreground">Services + Tips</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      ${(stats?.revenueToday || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">This Week</div>
                      <div className="text-sm text-muted-foreground">Total earnings</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      ${(stats?.revenueWeek || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">This Month</div>
                      <div className="text-sm text-muted-foreground">Total earnings</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      ${(stats?.revenueMonth || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payouts">
                <StaffPayouts
                  staffId={id}
                  stripeAccountId={staff.stripeAccountId}
                  stripeAccountStatus={staff.stripeAccountStatus}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
