"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ServicePicker } from "./ServicePicker";
import { ProviderPicker } from "./ProviderPicker";
import { TimeSlotPicker } from "../calendar/TimeSlotPicker";
import { ConfirmationPage } from "./ConfirmationPage";
import { Calendar, User, Clock, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { format, addDays } from "date-fns";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
}

interface Provider {
  id: string;
  name: string;
  title?: string;
  imageUrl?: string;
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

interface BookingWidgetProps {
  businessId?: string;
  onComplete?: (booking: BookingData) => void;
  allowAnyProvider?: boolean;
}

type BookingStep = "services" | "provider" | "datetime" | "confirm";

export function BookingWidget({
  businessId,
  onComplete,
  allowAnyProvider = true,
}: BookingWidgetProps) {
  const [step, setStep] = useState<BookingStep>("services");
  const [booking, setBooking] = useState<BookingData>({
    services: [],
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const steps: { key: BookingStep; label: string; icon: React.ReactNode }[] = [
    { key: "services", label: "Services", icon: <Calendar className="h-4 w-4" /> },
    { key: "provider", label: "Provider", icon: <User className="h-4 w-4" /> },
    { key: "datetime", label: "Date & Time", icon: <Clock className="h-4 w-4" /> },
    { key: "confirm", label: "Confirm", icon: <CheckCircle className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const totalDuration = booking.services.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = booking.services.reduce((sum, s) => sum + s.price, 0);

  const canProceed = () => {
    switch (step) {
      case "services":
        return booking.services.length > 0;
      case "provider":
        return !!booking.provider;
      case "datetime":
        return !!booking.date && !!booking.time;
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const stepOrder: BookingStep[] = ["services", "provider", "datetime", "confirm"];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: BookingStep[] = ["services", "provider", "datetime", "confirm"];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleServiceSelect = (services: Service[]) => {
    setBooking((prev) => ({ ...prev, services }));
  };

  const handleProviderSelect = (provider: Provider) => {
    setBooking((prev) => ({ ...prev, provider }));
  };

  const handleTimeSelect = (time: string) => {
    setBooking((prev) => ({ ...prev, date: selectedDate, time }));
  };

  const handleConfirm = (clientInfo: BookingData["clientInfo"]) => {
    const finalBooking = { ...booking, clientInfo };
    onComplete?.(finalBooking);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Book an Appointment</CardTitle>

        {/* Progress Steps */}
        <div className="mt-4">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {steps.map((s, index) => (
              <div
                key={s.key}
                className={`flex flex-col items-center ${
                  index <= currentStepIndex ? "text-rose-600" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex
                      ? "bg-rose-600 text-white"
                      : "bg-muted"
                  }`}
                >
                  {s.icon}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Summary Bar */}
        {booking.services.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
            <div className="flex justify-between items-center">
              <span>
                {booking.services.length} service{booking.services.length !== 1 ? "s" : ""}
              </span>
              <span className="font-medium">
                {totalDuration} min · ${totalPrice.toFixed(2)}
              </span>
            </div>
            {booking.provider && (
              <p className="text-muted-foreground mt-1">
                with {booking.provider.name}
              </p>
            )}
            {booking.date && booking.time && (
              <p className="text-muted-foreground">
                {format(booking.date, "EEEE, MMMM d")} at {booking.time}
              </p>
            )}
          </div>
        )}

        {/* Step Content */}
        {step === "services" && (
          <ServicePicker
            selectedServices={booking.services}
            onSelect={handleServiceSelect}
          />
        )}

        {step === "provider" && (
          <ProviderPicker
            serviceIds={booking.services.map((s) => s.id)}
            selectedProvider={booking.provider}
            onSelect={handleProviderSelect}
            allowAnyProvider={allowAnyProvider}
          />
        )}

        {step === "datetime" && (
          <div className="space-y-4">
            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Date</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 14 }, (_, i) => {
                  const date = addDays(new Date(), i);
                  const isSelected =
                    selectedDate &&
                    format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
                  return (
                    <Button
                      key={i}
                      variant={isSelected ? "default" : "outline"}
                      className={`flex-col h-auto py-2 px-3 min-w-[70px] ${
                        isSelected ? "bg-rose-600 hover:bg-rose-700" : ""
                      }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <span className="text-xs">{format(date, "EEE")}</span>
                      <span className="text-lg font-bold">{format(date, "d")}</span>
                      <span className="text-xs">{format(date, "MMM")}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            <TimeSlotPicker
              date={selectedDate}
              duration={totalDuration}
              staffId={booking.provider?.id}
              onSelect={handleTimeSelect}
              selectedTime={booking.time}
            />
          </div>
        )}

        {step === "confirm" && (
          <ConfirmationPage
            booking={booking}
            onConfirm={handleConfirm}
            onBack={handleBack}
          />
        )}

        {/* Navigation Buttons */}
        {step !== "confirm" && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === "services"}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
