"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

interface Appointment {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  salon: {
    name: string;
    address: string;
  };
  services: Array<{
    name: string;
    duration: number;
    price: number;
  }>;
  staff: {
    displayName: string;
  };
}

export default function MyAppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

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
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.scheduledStart) > now
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.scheduledStart) <= now
  );

  const displayedAppointments =
    tab === "upcoming" ? upcomingAppointments : pastAppointments;

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-600">View and manage your appointments</p>
        </div>
        <button
          onClick={() => router.push("/client/book")}
          className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
        >
          Book New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab("upcoming")}
          className={`pb-3 px-1 font-medium transition-colors ${
            tab === "upcoming"
              ? "text-rose-600 border-b-2 border-rose-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Upcoming ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setTab("past")}
          className={`pb-3 px-1 font-medium transition-colors ${
            tab === "past"
              ? "text-rose-600 border-b-2 border-rose-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Past ({pastAppointments.length})
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {displayedAppointments.length > 0 ? (
          displayedAppointments.map((apt) => (
            <div
              key={apt.id}
              onClick={() => router.push(`/client/appointments/${apt.id}`)}
              className="bg-white rounded-xl border p-4 cursor-pointer hover:border-rose-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-rose-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {apt.salon?.name || "Salon"}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(apt.scheduledStart).toLocaleDateString()} at{" "}
                        {new Date(apt.scheduledStart).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {apt.salon?.address && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{apt.salon.address}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {apt.services?.map((service, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      apt.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : apt.status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {apt.status === "COMPLETED" && (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    {apt.status === "CANCELLED" && (
                      <XCircle className="h-3 w-3" />
                    )}
                    {apt.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p>
              No {tab} appointments
            </p>
            {tab === "upcoming" && (
              <button
                onClick={() => router.push("/client/book")}
                className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                Book an Appointment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
