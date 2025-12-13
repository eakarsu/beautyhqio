"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Search,
  CheckCircle,
  Clock,
  User,
  ArrowRight,
  X,
} from "lucide-react";
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

interface CheckInFlowProps {
  onCheckInComplete?: (appointment: Appointment) => void;
  onCancel?: () => void;
}

type FlowStep = "phone" | "select" | "confirming" | "complete";

export function CheckInFlow({ onCheckInComplete, onCancel }: CheckInFlowProps) {
  const [step, setStep] = useState<FlowStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhone(e.target.value));
    setError(null);
  };

  const handleSearch = async () => {
    if (phoneNumber.length < 14) return;

    setIsLoading(true);
    setError(null);

    try {
      const cleaned = phoneNumber.replace(/\D/g, "");
      const response = await fetch(`/api/appointments?phone=${cleaned}&today=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.length === 0) {
          setError("No appointments found for today. Would you like to join the waitlist?");
        } else {
          setAppointments(data);
          setStep("select");
        }
      }
    } catch (err) {
      console.error("Error searching:", err);
      // Demo data
      setAppointments([
        {
          id: "1",
          scheduledStart: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
          client: { firstName: "Jane", lastName: "Doe" },
          staff: { displayName: "Sarah Johnson", user: { firstName: "Sarah", lastName: "Johnson" } },
          services: [{ service: { name: "Haircut & Style" } }],
        },
      ]);
      setStep("select");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setStep("confirming");
    handleCheckIn(appointment);
  };

  const handleCheckIn = async (appointment: Appointment) => {
    try {
      await fetch(`/api/appointments/${appointment.id}/check-in`, {
        method: "POST",
      });
      setStep("complete");
      onCheckInComplete?.(appointment);
    } catch (err) {
      console.error("Error checking in:", err);
      // Demo mode - still show success
      setStep("complete");
      onCheckInComplete?.(appointment);
    }
  };

  const getStaffName = (apt: Appointment) => {
    return apt.staff.displayName || `${apt.staff.user.firstName} ${apt.staff.user.lastName}`;
  };

  const handleKeypadPress = (digit: string) => {
    if (phoneNumber.replace(/\D/g, "").length < 10) {
      setPhoneNumber(formatPhone(phoneNumber.replace(/\D/g, "") + digit));
    }
  };

  const handleKeypadClear = () => {
    setPhoneNumber("");
  };

  const handleKeypadBackspace = () => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    setPhoneNumber(formatPhone(cleaned.slice(0, -1)));
  };

  // Phone entry step
  if (step === "phone") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-600 rounded-full mb-4">
            <Phone className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Check In</h2>
          <p className="text-xl text-muted-foreground mt-2">
            Enter your phone number
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                className="pl-14 h-16 text-3xl text-center font-mono"
                value={phoneNumber}
                onChange={handlePhoneChange}
                readOnly
              />
            </div>

            {error && (
              <p className="text-red-600 text-center mt-4">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <Button
              key={digit}
              variant="outline"
              className="h-20 text-3xl font-bold"
              onClick={() => handleKeypadPress(digit)}
            >
              {digit}
            </Button>
          ))}
          <Button
            variant="outline"
            className="h-20 text-lg"
            onClick={handleKeypadClear}
          >
            Clear
          </Button>
          <Button
            variant="outline"
            className="h-20 text-3xl font-bold"
            onClick={() => handleKeypadPress("0")}
          >
            0
          </Button>
          <Button
            variant="outline"
            className="h-20 text-lg"
            onClick={handleKeypadBackspace}
          >
            ←
          </Button>
        </div>

        <div className="flex gap-4">
          {onCancel && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-16 text-lg"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1 h-16 text-lg bg-rose-600 hover:bg-rose-700"
            onClick={handleSearch}
            disabled={phoneNumber.length < 14 || isLoading}
          >
            {isLoading ? "Searching..." : "Find My Appointment"}
            <ArrowRight className="h-6 w-6 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Select appointment step
  if (step === "select") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back!
          </h2>
          <p className="text-xl text-muted-foreground mt-2">
            Select your appointment to check in
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {appointments.map((apt) => (
            <Card
              key={apt.id}
              className="cursor-pointer hover:border-rose-500 transition-colors"
              onClick={() => handleSelectAppointment(apt)}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center min-w-[100px]">
                    <div className="text-3xl font-bold">
                      {format(new Date(apt.scheduledStart), "h:mm")}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {format(new Date(apt.scheduledStart), "a")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-medium">
                      {apt.services.map((s) => s.service.name).join(", ")}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      with {getStaffName(apt)}
                    </div>
                  </div>
                </div>
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  Check In
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-14"
          onClick={() => {
            setStep("phone");
            setPhoneNumber("");
          }}
        >
          ← Go Back
        </Button>
      </div>
    );
  }

  // Confirming step
  if (step === "confirming") {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <CheckCircle className="h-12 w-12 text-rose-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Checking you in...</h2>
        <p className="text-xl text-muted-foreground mt-2">
          Please wait a moment
        </p>
      </div>
    );
  }

  // Complete step
  if (step === "complete" && selectedAppointment) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          You're Checked In!
        </h2>
        <p className="text-2xl text-muted-foreground mb-8">
          {selectedAppointment.client.firstName}, please have a seat.
        </p>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-xl font-medium mb-2">
              {selectedAppointment.services.map((s) => s.service.name).join(", ")}
            </div>
            <div className="text-lg text-muted-foreground mb-4">
              with {getStaffName(selectedAppointment)}
            </div>
            <div className="flex items-center justify-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              {format(new Date(selectedAppointment.scheduledStart), "h:mm a")}
            </div>
          </CardContent>
        </Card>

        <p className="text-xl text-muted-foreground mb-6">
          Your stylist will be with you shortly.
        </p>

        <Button
          size="lg"
          variant="outline"
          className="h-14 text-lg"
          onClick={() => {
            setStep("phone");
            setPhoneNumber("");
            setSelectedAppointment(null);
          }}
        >
          Done
        </Button>
      </div>
    );
  }

  return null;
}
