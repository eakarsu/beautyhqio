"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
} from "lucide-react";

interface SalonDetails {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    monthlyPrice: number;
    commissionRate: number;
    currentPeriodEnd: string | null;
  } | null;
  stats: {
    totalUsers: number;
    totalClients: number;
    totalAppointments: number;
    totalRevenue: number;
  };
  locations: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
  }>;
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>;
}

export default function SalonDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const salonId = params.id as string;
  const [salon, setSalon] = useState<SalonDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isPlatformAdmin) {
      router.push("/dashboard");
      return;
    }

    if (status === "authenticated" && session?.user?.isPlatformAdmin && salonId) {
      fetchSalonDetails();
    }
  }, [session, status, router, salonId]);

  const fetchSalonDetails = async () => {
    try {
      const response = await fetch(`/api/admin/salons/${salonId}`);
      if (response.ok) {
        const data = await response.json();
        setSalon(data);
      } else {
        console.error("Failed to fetch salon details");
      }
    } catch (error) {
      console.error("Error fetching salon details:", error);
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

  if (!salon) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.push("/admin/salons")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Salons
        </Button>
        <div className="mt-8 text-center text-slate-500">
          Salon not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/admin/salons")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{salon.name}</h1>
          <p className="text-slate-500">{salon.type.replace("_", " ")}</p>
        </div>
        <Badge
          className={
            salon.subscription?.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : salon.subscription?.status === "TRIAL"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {salon.subscription?.plan || "No Plan"} - {salon.subscription?.status || "N/A"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Users</p>
                <p className="text-xl font-bold">{salon.stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Clients</p>
                <p className="text-xl font-bold">{salon.stats.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Appointments</p>
                <p className="text-xl font-bold">{salon.stats.totalAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-rose-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Revenue</p>
                <p className="text-xl font-bold">${salon.stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {salon.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{salon.phone}</span>
              </div>
            )}
            {salon.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{salon.email}</span>
              </div>
            )}
            {salon.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-slate-400" />
                <a href={salon.website} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline">
                  {salon.website}
                </a>
              </div>
            )}
            {(salon.address || salon.city) && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{[salon.address, salon.city, salon.state].filter(Boolean).join(", ")}</span>
              </div>
            )}
            <div className="pt-2 border-t">
              <p className="text-sm text-slate-500">
                Member since {new Date(salon.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan</span>
              <span className="font-medium">{salon.subscription?.plan || "STARTER"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <Badge
                className={
                  salon.subscription?.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : salon.subscription?.status === "TRIAL"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {salon.subscription?.status || "N/A"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Monthly Price</span>
              <span className="font-medium">${salon.subscription?.monthlyPrice || 0}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Commission Rate</span>
              <span className="font-medium">{salon.subscription?.commissionRate || 9}%</span>
            </div>
            {salon.subscription?.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-slate-500">Next Billing</span>
                <span className="font-medium">
                  {new Date(salon.subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({salon.users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {salon.users.map((user) => (
              <div key={user.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <Badge variant="outline">{user.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Locations */}
      {salon.locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Locations ({salon.locations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {salon.locations.map((location) => (
                <div key={location.id} className="py-3">
                  <p className="font-medium">{location.name}</p>
                  <p className="text-sm text-slate-500">
                    {location.address}, {location.city}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
