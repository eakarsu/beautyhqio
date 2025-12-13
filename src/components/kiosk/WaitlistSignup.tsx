"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  User,
  Scissors,
  Clock,
  CheckCircle,
  ArrowRight,
  Users,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface WaitlistSignupProps {
  onComplete?: (entry: { name: string; phone: string; services: string[] }) => void;
  onCancel?: () => void;
  currentWaitTime?: number;
  peopleWaiting?: number;
}

type FlowStep = "info" | "services" | "confirm" | "complete";

export function WaitlistSignup({
  onComplete,
  onCancel,
  currentWaitTime = 15,
  peopleWaiting = 3,
}: WaitlistSignupProps) {
  const [step, setStep] = useState<FlowStep>("info");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    services: [] as string[],
  });
  const [services, setServices] = useState<Service[]>([
    { id: "s1", name: "Haircut", duration: 30, price: 45 },
    { id: "s2", name: "Haircut & Style", duration: 45, price: 65 },
    { id: "s3", name: "Men's Cut", duration: 20, price: 30 },
    { id: "s4", name: "Kid's Cut", duration: 20, price: 25 },
    { id: "s5", name: "Beard Trim", duration: 15, price: 20 },
    { id: "s6", name: "Blowout", duration: 30, price: 45 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      phone: formatPhone(e.target.value),
    }));
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone.replace(/\D/g, ""),
          serviceIds: formData.services,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPosition(data.position || peopleWaiting + 1);
        setEstimatedWait(data.estimatedWait || currentWaitTime + 15);
        setStep("complete");
        onComplete?.({
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          services: formData.services,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      // Demo mode
      setPosition(peopleWaiting + 1);
      setEstimatedWait(currentWaitTime + 15);
      setStep("complete");
      onComplete?.({
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        services: formData.services,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInfoValid = formData.firstName && formData.lastName && formData.phone.length >= 14;
  const isServicesValid = formData.services.length > 0;

  // Info step
  if (step === "info") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-600 rounded-full mb-4">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Join the Waitlist</h2>
          <p className="text-xl text-muted-foreground mt-2">
            Enter your information
          </p>
        </div>

        {/* Current wait info */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-rose-600">{peopleWaiting}</div>
            <div className="text-sm text-muted-foreground">People Waiting</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-rose-600">~{currentWaitTime}</div>
            <div className="text-sm text-muted-foreground">Min Wait</div>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-lg">First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  placeholder="Jane"
                  className="h-14 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-lg">Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  placeholder="Doe"
                  className="h-14 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="pl-12 h-14 text-lg"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                We'll text you when it's almost your turn
              </p>
            </div>
          </CardContent>
        </Card>

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
            onClick={() => setStep("services")}
            disabled={!isInfoValid}
          >
            Next: Select Service
            <ArrowRight className="h-6 w-6 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Services step
  if (step === "services") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-600 rounded-full mb-4">
            <Scissors className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">What do you need?</h2>
          <p className="text-xl text-muted-foreground mt-2">
            Select the services you'd like
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {services.map((service) => {
            const isSelected = formData.services.includes(service.id);
            return (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "border-2 border-rose-500 bg-rose-50"
                    : "hover:border-gray-300"
                }`}
                onClick={() => toggleService(service.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-medium">{service.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {service.duration} min
                        </span>
                        <span>${service.price}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-6 w-6 text-rose-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-16 text-lg"
            onClick={() => setStep("info")}
          >
            ← Go Back
          </Button>
          <Button
            size="lg"
            className="flex-1 h-16 text-lg bg-rose-600 hover:bg-rose-700"
            onClick={() => setStep("confirm")}
            disabled={!isServicesValid}
          >
            Review & Confirm
            <ArrowRight className="h-6 w-6 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Confirm step
  if (step === "confirm") {
    const selectedServices = services.filter((s) => formData.services.includes(s.id));
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Confirm Details</h2>
          <p className="text-xl text-muted-foreground mt-2">
            Review your waitlist request
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <User className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="font-medium text-lg">
                  {formData.firstName} {formData.lastName}
                </p>
                <p className="text-muted-foreground">{formData.phone}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Services:</p>
              <div className="space-y-2">
                {selectedServices.map((service) => (
                  <div key={service.id} className="flex justify-between">
                    <span className="font-medium">{service.name}</span>
                    <span className="text-muted-foreground">{service.duration} min</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg">
                <span>Estimated Service Time:</span>
                <span className="font-bold">{totalDuration} min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">
                Estimated wait: ~{currentWaitTime + 15} minutes
              </p>
              <p className="text-sm text-yellow-700">
                We'll text you when it's almost your turn
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-16 text-lg"
            onClick={() => setStep("services")}
          >
            ← Go Back
          </Button>
          <Button
            size="lg"
            className="flex-1 h-16 text-lg bg-green-600 hover:bg-green-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Join Waitlist"}
            <CheckCircle className="h-6 w-6 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Complete step
  if (step === "complete") {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          You're on the List!
        </h2>
        <p className="text-2xl text-muted-foreground mb-8">
          {formData.firstName}, we'll see you soon
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-rose-600">#{position}</div>
              <div className="text-lg text-muted-foreground">Your Position</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-rose-600">~{estimatedWait}</div>
              <div className="text-lg text-muted-foreground">Minutes</div>
            </CardContent>
          </Card>
        </div>

        <p className="text-lg text-muted-foreground mb-8">
          We'll text {formData.phone} when it's almost your turn.
          <br />
          Please stay nearby!
        </p>

        <Button
          size="lg"
          variant="outline"
          className="h-14 text-lg"
          onClick={() => {
            setStep("info");
            setFormData({ firstName: "", lastName: "", phone: "", services: [] });
          }}
        >
          Done
        </Button>
      </div>
    );
  }

  return null;
}
