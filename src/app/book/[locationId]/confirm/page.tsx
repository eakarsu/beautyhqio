"use client";

import { useState, useEffect, useRef, use, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { toast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  requireDeposit?: boolean;
  depositAmount?: number | null;
  depositPercent?: number | null;
}

interface Staff {
  id: string;
  displayName?: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string | null;
}

export default function ConfirmBookingPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const servicesParam = searchParams.get("services");
  const serviceIds = useMemo(() => servicesParam?.split(",") || [], [servicesParam]);
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const staffId = searchParams.get("staff") || "";
  const rescheduleId = searchParams.get("reschedule") || "";

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [depositDueCents, setDepositDueCents] = useState(0);
  const [rescheduleVersion, setRescheduleVersion] = useState<number | null>(null);
  const [rescheduleError, setRescheduleError] = useState("");

  const { data: session, status: sessionStatus } = useSession();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Pre-fill form with logged-in user data
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        firstName: session.user.firstName || prev.firstName,
        lastName: session.user.lastName || prev.lastName,
        email: session.user.email || prev.email,
      }));
    }
  }, [session]);

  useEffect(() => {
    fetch(`/api/booking/catalog?locationId=${encodeURIComponent(locationId)}`)
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw Error(data.error || 'Booking catalog unavailable'); return data; })
      .then((data) => {
        setLocation(data.location);
        setStaff(data.staff.find((person: Staff) => person.id === staffId) || null);
        setServices(serviceIds.map(id => data.services.find((service: Service) => service.id === id)).filter(Boolean));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locationId, staffId, serviceIds]);

  useEffect(() => {
    if (!rescheduleId) return;
    fetch(`/api/client/appointments/${encodeURIComponent(rescheduleId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || "Appointment unavailable");
        if (data.appointment.locationId !== locationId || data.appointment.services.length !== serviceIds.length ||
            serviceIds.some((id) => !data.appointment.services.some((service: Service) => service.id === id))) {
          throw new Error("Appointment details changed. Return to your appointments and try again.");
        }
        setRescheduleVersion(data.appointment.version);
      })
      .catch((error) => setRescheduleError(error instanceof Error ? error.message : "Unable to load appointment"));
  }, [rescheduleId, locationId, serviceIds]);

  const bookingAttempt = useRef<{ body: string; key: string } | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (rescheduleId && rescheduleVersion === null) throw new Error(rescheduleError || "Appointment is still loading");
      const requestBody = rescheduleId
        ? JSON.stringify({ date, time, staffId, version: rescheduleVersion, reason: "Requested by client" })
        : JSON.stringify({ locationId, serviceIds, staffId, date, time, phone: formData.phone, notes: formData.notes });
      if (bookingAttempt.current?.body !== requestBody) bookingAttempt.current = { body: requestBody, key: crypto.randomUUID() };
      const response = await fetch(rescheduleId ? `/api/appointments/${encodeURIComponent(rescheduleId)}/reschedule` : "/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": bookingAttempt.current.key },
        body: requestBody,
      });

      const data = await response.json();

      if (response.ok) {
        setConfirmationNumber(rescheduleId || data.confirmationNumber);
        setDepositDueCents(data.appointment?.depositIntent?.status === 'PENDING' ? data.appointment.depositIntent.amountCents : 0);
        setConfirmed(true);
      } else {
        toast({ title: "Error", description: data.message || data.error || "Failed to save appointment", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save appointment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const totalDuration = services.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const totalPrice = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const estimatedDeposit = services.reduce((sum, service) => service.requireDeposit ? sum + (Number(service.depositAmount) > 0 ? Number(service.depositAmount) : Math.round(Number(service.price) * Number(service.depositPercent || 0)) / 100) : sum, 0);
  const returnPath = `/book/${locationId}/confirm?${searchParams.toString()}`;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {rescheduleId ? "Appointment Rescheduled" : depositDueCents > 0 ? "Booking Saved · Deposit Due" : "Booking Saved"}
            </h1>
            <p className="text-gray-600 mb-6">
              {rescheduleId ? "Your new appointment time has been saved." : depositDueCents > 0 ? `Your appointment is awaiting a ${(depositDueCents / 100).toFixed(2)} deposit. Contact the salon to arrange payment before confirmation.` : "Your appointment has been saved."}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-500 mb-1">Confirmation Number</p>
              <p className="text-xl font-mono font-bold text-pink-600">
                {confirmationNumber}
              </p>
            </div>

            <div className="text-left space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>{formattedDate} at {time}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span>{location?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <span>
                  {staff?.displayName || `${staff?.user?.firstName || ''} ${staff?.user?.lastName || ''}`.trim() || 'Staff'}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Check your appointment details for the current status. Any message delivery depends on the salon&apos;s notification service.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                Return to Home
              </Button>
              <Button
                onClick={() => router.push("/explore")}
                variant="outline"
                className="w-full"
              >
                Book Another Appointment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {rescheduleId ? "Review Your New Time" : "Confirm Your Booking"}
          </h1>
          <p className="text-gray-600">{rescheduleId ? "Your existing appointment and payment history will be preserved." : "Sign in with your client account to complete booking."}</p>
          {rescheduleError && <p role="alert" className="mt-3 text-red-700">{rescheduleError}</p>}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{rescheduleId ? "Confirm Reschedule" : "Your Information"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {!rescheduleId && <>
                  {sessionStatus === 'unauthenticated' && <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">Sign in with a verified client account to save this booking. <Link className="font-semibold underline" href={`/login?callbackUrl=${encodeURIComponent(returnPath)}`}>Sign in and return here</Link></p>}
                  {sessionStatus === 'authenticated' && !session?.user?.isClient && <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">This account is not a client account. Sign in with a client account to book online.</p>}
                  {session?.user?.isClient && <p className="text-sm text-gray-700">Booking as {session.user.email}. Your verified account name is used for the client record.</p>}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special requests or notes for your appointment..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>

                  </>}
                  <Button
                    type="submit"
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    disabled={submitting || sessionStatus !== 'authenticated' || !session?.user?.isClient || !!rescheduleError || (!!rescheduleId && rescheduleVersion === null) || !location || !staff || services.length !== serviceIds.length}
                  >
                    {submitting ? "Saving..." : rescheduleId ? "Confirm New Time" : "Confirm Booking"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{formattedDate}</p>
                    <p className="text-sm text-gray-500">at {time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{location?.name}</p>
                    <p className="text-sm text-gray-500">
                      {location?.address}, {location?.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {staff?.displayName || `${staff?.user?.firstName || ''} ${staff?.user?.lastName || ''}`.trim() || 'Staff'}
                    </p>
                  </div>
                </div>

                <hr />
                {estimatedDeposit > 0 && <p className="text-sm text-amber-700">Estimated deposit due: ${estimatedDeposit.toFixed(2)}. The salon records cash collection or a waiver before confirmation. No card charge is made here.</p>}

                <div className="space-y-2">
                  <p className="font-medium">Services</p>
                  {services.map((service, index) => (
                    <div
                      key={service.id || `service-${index}`}
                      className="flex justify-between text-sm"
                    >
                      <span>{service.name || "Service"}</span>
                      <span>${(Number(service.price) || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <hr />

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{totalDuration} minutes total</span>
                </div>

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
