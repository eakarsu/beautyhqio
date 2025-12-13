"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  User,
  Search,
  Plus,
  CheckCircle,
} from "lucide-react";

interface Appointment {
  id: string;
  startTime: string;
  status: string;
  client: {
    firstName: string;
    lastName: string;
  };
  services: Array<{
    service: { name: string };
  }>;
}

export default function KioskPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"home" | "checkin" | "walkin" | "confirmed">(
    "home"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmedName, setConfirmedName] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (mode === "checkin") {
      setLoading(true);
      fetch(`/api/appointments?date=${today}&status=confirmed`)
        .then((res) => res.json())
        .then((data) => {
          setAppointments(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [mode]);

  const filteredAppointments = appointments.filter((apt) => {
    if (!searchQuery) return true;
    const name =
      `${apt.client.firstName} ${apt.client.lastName}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const handleCheckIn = async (appointmentId: string, clientName: string) => {
    try {
      await fetch(`/api/appointments/${appointmentId}/check-in`, {
        method: "POST",
      });
      setConfirmedName(clientName);
      setMode("confirmed");
      setTimeout(() => {
        setMode("home");
        setConfirmedName("");
      }, 5000);
    } catch (error) {
      alert("Failed to check in");
    }
  };

  const handleWalkIn = () => {
    router.push("/kiosk/walkin");
  };

  // Home Screen
  if (mode === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Welcome</h1>
          <p className="text-xl text-white/80 mb-12">
            Please select an option below
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <Card
              className="cursor-pointer hover:scale-105 transition-transform bg-white/10 backdrop-blur border-white/20"
              onClick={() => setMode("checkin")}
            >
              <CardContent className="p-8 text-center">
                <Calendar className="h-16 w-16 text-white mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">
                  I Have an Appointment
                </h2>
                <p className="text-white/70">Check in for your scheduled visit</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:scale-105 transition-transform bg-white/10 backdrop-blur border-white/20"
              onClick={handleWalkIn}
            >
              <CardContent className="p-8 text-center">
                <Plus className="h-16 w-16 text-white mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Walk-In</h2>
                <p className="text-white/70">Join the waitlist for service</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-white/50 mt-12 text-sm">
            Touch anywhere to begin
          </p>
        </div>
      </div>
    );
  }

  // Confirmation Screen
  if (mode === "confirmed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-emerald-900 flex items-center justify-center p-8">
        <div className="text-center">
          <CheckCircle className="h-24 w-24 text-white mx-auto mb-6 animate-bounce" />
          <h1 className="text-4xl font-bold text-white mb-4">
            You're Checked In!
          </h1>
          <p className="text-2xl text-white/80 mb-8">{confirmedName}</p>
          <p className="text-white/60">
            Please have a seat, your stylist will be with you shortly.
          </p>
        </div>
      </div>
    );
  }

  // Check-in Screen
  if (mode === "checkin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="text-white mb-6"
            onClick={() => setMode("home")}
          >
            ← Back
          </Button>

          <h1 className="text-4xl font-bold text-white mb-2">Check In</h1>
          <p className="text-white/70 mb-8">Find your appointment below</p>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              className="pl-12 h-14 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Appointments List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
                <Card
                  key={apt.id}
                  className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                  onClick={() =>
                    handleCheckIn(
                      apt.id,
                      `${apt.client.firstName} ${apt.client.lastName}`
                    )
                  }
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <User className="h-7 w-7 text-pink-300" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {apt.client.firstName} {apt.client.lastName}
                        </h3>
                        <div className="flex items-center gap-3 text-white/60 mt-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(apt.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span>
                            {apt.services.map((s) => s.service.name).join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button className="bg-pink-600 hover:bg-pink-700 text-lg px-6">
                      Check In
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {filteredAppointments.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/60 text-lg">
                    No appointments found. Please check with the front desk.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 border-white/20 text-white hover:bg-white/10"
                    onClick={handleWalkIn}
                  >
                    Join Walk-In Waitlist
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
