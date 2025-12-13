"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Phone, Search, CheckCircle, ArrowLeft, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  scheduledStart: string;
  client: {
    firstName: string;
    lastName: string;
  };
  staff: {
    displayName?: string;
    user: { firstName: string; lastName: string };
  };
  services: Array<{ service: { name: string } }>;
}

export default function KioskCheckInPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const cleaned = phoneNumber.replace(/\D/g, "");
      const response = await fetch(`/api/appointments?phone=${cleaned}&today=true`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error searching:", error);
      // Demo data
      setAppointments([
        {
          id: "1",
          scheduledStart: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
          client: { firstName: "Jane", lastName: "Doe" },
          staff: { displayName: "Sarah Johnson", user: { firstName: "Sarah", lastName: "Johnson" } },
          services: [{ service: { name: "Haircut & Style" } }],
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckIn = async (appointment: Appointment) => {
    try {
      await fetch(`/api/appointments/${appointment.id}/check-in`, {
        method: "POST",
      });
      setSelectedAppointment(appointment);
      setCheckedIn(true);
    } catch (error) {
      console.error("Error checking in:", error);
      // Demo mode
      setSelectedAppointment(appointment);
      setCheckedIn(true);
    }
  };

  const getStaffName = (apt: Appointment) => {
    return apt.staff.displayName || `${apt.staff.user.firstName} ${apt.staff.user.lastName}`;
  };

  if (checkedIn && selectedAppointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-8">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Checked In!</h1>
            <p className="text-xl text-muted-foreground mb-6">
              {selectedAppointment.client.firstName}, please have a seat.
            </p>

            <div className="bg-muted p-4 rounded-lg mb-8">
              <div className="text-lg font-medium">
                {selectedAppointment.services.map((s) => s.service.name).join(", ")}
              </div>
              <div className="text-muted-foreground">with {getStaffName(selectedAppointment)}</div>
              <div className="text-muted-foreground mt-2">
                <Clock className="h-4 w-4 inline mr-1" />
                {format(new Date(selectedAppointment.scheduledStart), "h:mm a")}
              </div>
            </div>

            <p className="text-muted-foreground">
              Your stylist will be with you shortly.
            </p>

            <Button
              className="mt-8"
              variant="outline"
              size="lg"
              onClick={() => {
                setCheckedIn(false);
                setSelectedAppointment(null);
                setPhoneNumber("");
                setAppointments([]);
              }}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => router.push("/kiosk")}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-600 rounded-full mb-4">
            <Scissors className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Check In</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Enter your phone number to find your appointment
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="pl-14 h-16 text-2xl"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                className="h-16 px-8 text-lg bg-rose-600 hover:bg-rose-700"
                onClick={handleSearch}
                disabled={phoneNumber.length < 14 || isSearching}
              >
                {isSearching ? (
                  "Searching..."
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Find
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {appointments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Appointments Today</h2>
            {appointments.map((apt) => (
              <Card
                key={apt.id}
                className="cursor-pointer hover:border-rose-500 transition-colors"
                onClick={() => handleCheckIn(apt)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <div className="text-2xl font-bold">
                        {format(new Date(apt.scheduledStart), "h:mm")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(apt.scheduledStart), "a")}
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-medium">
                        {apt.services.map((s) => s.service.name).join(", ")}
                      </div>
                      <div className="text-muted-foreground">with {getStaffName(apt)}</div>
                    </div>
                  </div>
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Check In
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {appointments.length === 0 && phoneNumber.length >= 14 && !isSearching && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No appointments found for this phone number today.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => router.push("/kiosk/walkin")}
              >
                Sign up as a Walk-In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
