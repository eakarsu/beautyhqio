"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Gift, CreditCard, MapPin } from "lucide-react";

interface Appointment {
  id: string;
  scheduledStart: string;
  status: string;
  salon: {
    name: string;
    address: string;
  };
  services: Array<{
    name: string;
  }>;
  staff: {
    displayName: string;
  };
}

export default function ClientPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isClient) {
      router.push("/dashboard");
      return;
    }
    if (status === "authenticated") {
      fetchAppointments();
    }
  }, [session, status, router]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/client/appointments");
      if (response.ok) {
        const data = await response.json();
        // Filter only upcoming appointments
        const now = new Date();
        const upcoming = (data.appointments || []).filter(
          (apt: Appointment) => new Date(apt.scheduledStart) > now
        );
        setAppointments(upcoming.slice(0, 3)); // Show max 3
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
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

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {session?.user?.firstName}!
        </h1>
        <p className="text-slate-600">
          Book appointments, manage your profile, and earn rewards.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => router.push("/client/book")}
          className="bg-white rounded-xl border p-6 text-left hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="h-12 w-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-rose-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Book Appointment</h3>
          <p className="text-sm text-slate-500 mt-1">
            Schedule your next visit
          </p>
        </button>

        <button
          onClick={() => router.push("/client/appointments")}
          className="bg-white rounded-xl border p-6 text-left hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900">My Appointments</h3>
          <p className="text-sm text-slate-500 mt-1">
            View upcoming & past visits
          </p>
        </button>

        <button
          onClick={() => router.push("/client/rewards")}
          className="bg-white rounded-xl border p-6 text-left hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Gift className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-slate-900">My Rewards</h3>
          <p className="text-sm text-slate-500 mt-1">
            Check points & redeem rewards
          </p>
        </button>

        <button
          onClick={() => router.push("/client/payments")}
          className="bg-white rounded-xl border p-6 text-left hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Payment Methods</h3>
          <p className="text-sm text-slate-500 mt-1">
            Manage your payment options
          </p>
        </button>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Upcoming Appointments
          </h2>
          {appointments.length > 0 && (
            <button
              onClick={() => router.push("/client/appointments")}
              className="text-sm text-rose-600 hover:text-rose-700"
            >
              View All
            </button>
          )}
        </div>
        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => router.push(`/client/appointments/${apt.id}`)}
              >
                <div className="h-12 w-12 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">
                    {apt.salon?.name || "Salon"}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(apt.scheduledStart).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(apt.scheduledStart).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {apt.salon?.address && (
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{apt.salon.address}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {apt.services?.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded"
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p>No upcoming appointments</p>
            <button
              onClick={() => router.push("/client/book")}
              className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Book Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
