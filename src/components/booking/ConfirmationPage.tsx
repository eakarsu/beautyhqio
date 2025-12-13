"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  CheckCircle,
  ArrowLeft,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Provider {
  id: string;
  name: string;
}

interface BookingData {
  services: Service[];
  provider?: Provider;
  date?: Date;
  time?: string;
  clientInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

interface ConfirmationPageProps {
  booking: BookingData;
  onConfirm: (clientInfo: BookingData["clientInfo"]) => void;
  onBack: () => void;
}

export function ConfirmationPage({ booking, onConfirm, onBack }: ConfirmationPageProps) {
  const [clientInfo, setClientInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptNotifications, setAcceptNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const totalDuration = booking.services.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = booking.services.reduce((sum, s) => sum + s.price, 0);

  const isValid =
    clientInfo.firstName &&
    clientInfo.lastName &&
    clientInfo.email &&
    clientInfo.phone &&
    acceptTerms;

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsComplete(true);
      onConfirm(clientInfo);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground mb-6">
          We've sent a confirmation to {clientInfo.email}
        </p>

        <Card className="text-left max-w-md mx-auto">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-rose-600" />
                <div>
                  <p className="font-medium">
                    {booking.date && format(booking.date, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">{booking.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-rose-600" />
                <p>{booking.provider?.name || "First Available"}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                {booking.services.map((service) => (
                  <div key={service.id} className="flex justify-between text-sm">
                    <span>{service.name}</span>
                    <span>${service.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-6">
          Need to make changes? Call us or manage your booking online.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Appointment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-rose-600" />
            <div>
              <p className="font-medium">
                {booking.date && format(booking.date, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">{booking.time}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-rose-600" />
            <p>{booking.provider?.name || "First Available"}</p>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-rose-600" />
            <p>{totalDuration} minutes</p>
          </div>

          <Separator />

          <div className="space-y-2">
            {booking.services.map((service) => (
              <div key={service.id} className="flex justify-between">
                <span>{service.name}</span>
                <span className="font-medium">${service.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-rose-600">${totalPrice.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Information</CardTitle>
          <CardDescription>We'll use this to confirm your appointment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={clientInfo.firstName}
                onChange={(e) =>
                  setClientInfo((prev) => ({ ...prev, firstName: e.target.value }))
                }
                placeholder="Jane"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={clientInfo.lastName}
                onChange={(e) =>
                  setClientInfo((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                className="pl-10"
                value={clientInfo.email}
                onChange={(e) =>
                  setClientInfo((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="jane@email.com"
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                className="pl-10"
                value={clientInfo.phone}
                onChange={(e) =>
                  setClientInfo((prev) => ({
                    ...prev,
                    phone: formatPhone(e.target.value),
                  }))
                }
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                I agree to the cancellation policy and terms of service *
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="notifications"
                checked={acceptNotifications}
                onCheckedChange={(checked) => setAcceptNotifications(checked as boolean)}
              />
              <label htmlFor="notifications" className="text-sm leading-tight cursor-pointer">
                Send me appointment reminders via text and email
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="bg-rose-600 hover:bg-rose-700"
        >
          {isSubmitting ? (
            "Booking..."
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Booking
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
