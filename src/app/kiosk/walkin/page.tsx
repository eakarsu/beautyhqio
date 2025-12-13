"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, Clock, Users } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
}

export default function KioskWalkInPage() {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "services" | "confirmed">("info");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [waitlistPosition, setWaitlistPosition] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/services?isActive=true")
      .then((res) => res.json())
      .then((data) => setServices(data))
      .catch(console.error);
  }, []);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // First, create or find client
      let clientId = null;
      if (formData.phone) {
        const clientRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            source: "walk_in",
          }),
        });
        const clientData = await clientRes.json();
        clientId = clientData.id;
      }

      // Get location ID (use first available for kiosk)
      const locRes = await fetch("/api/locations?isActive=true");
      const locations = await locRes.json();
      const locationId = locations[0]?.id;

      if (!locationId) {
        alert("No location configured");
        return;
      }

      // Add to waitlist
      const selectedServiceData = services.filter((s) =>
        selectedServices.includes(s.id)
      );
      const totalDuration = selectedServiceData.reduce(
        (sum, s) => sum + s.duration,
        0
      );

      const waitlistRes = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          clientId,
          phone: formData.phone,
          serviceNotes:
            selectedServiceData.map((s) => s.name).join(", ") +
            (formData.notes ? ` - ${formData.notes}` : ""),
          estimatedDuration: totalDuration,
        }),
      });

      const waitlistData = await waitlistRes.json();
      setWaitlistPosition(waitlistData.position);
      setEstimatedWait(waitlistData.estimatedWait);
      setStep("confirmed");
    } catch (error) {
      alert("Failed to join waitlist");
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(services.map((s) => s.category || "Other"))];

  // Confirmation Screen
  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-emerald-900 flex items-center justify-center p-8">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur border-white/20">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-2">
              You're on the List!
            </h1>
            <p className="text-white/80 mb-8">
              {formData.firstName}, we'll text you when it's your turn.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/10 rounded-lg p-4">
                <Users className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{waitlistPosition}</p>
                <p className="text-white/60 text-sm">Position</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Clock className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">~{estimatedWait}</p>
                <p className="text-white/60 text-sm">Minutes Wait</p>
              </div>
            </div>

            <p className="text-white/50 text-sm mb-6">
              Feel free to browse nearby or have a seat in our waiting area.
            </p>

            <Button
              className="w-full bg-white/20 hover:bg-white/30 text-white"
              onClick={() => router.push("/kiosk")}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Info & Services Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="text-white mb-6"
          onClick={() =>
            step === "services" ? setStep("info") : router.push("/kiosk")
          }
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold text-white mb-2">
          {step === "info" ? "Join Waitlist" : "Select Services"}
        </h1>
        <p className="text-white/70 mb-8">
          {step === "info"
            ? "Enter your information to join our walk-in waitlist"
            : "What services are you interested in today?"}
        </p>

        {step === "info" && (
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">First Name *</Label>
                    <Input
                      className="h-14 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Your first name"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Last Name</Label>
                    <Input
                      className="h-14 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Your last name"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Phone Number *</Label>
                  <Input
                    type="tel"
                    className="h-14 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="We'll text you when ready"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <Button
                  className="w-full h-14 text-lg bg-pink-600 hover:bg-pink-700"
                  onClick={() => setStep("services")}
                  disabled={!formData.firstName || !formData.phone}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "services" && (
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-xl font-semibold text-white mb-4">
                  {category}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {services
                    .filter((s) => (s.category || "Other") === category)
                    .map((service) => {
                      const isSelected = selectedServices.includes(service.id);
                      return (
                        <Card
                          key={service.id}
                          className={`cursor-pointer transition-all ${
                            isSelected
                              ? "bg-pink-600/30 border-pink-500"
                              : "bg-white/10 border-white/20 hover:bg-white/20"
                          }`}
                          onClick={() => toggleService(service.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold text-white">
                                  {service.name}
                                </h3>
                                <p className="text-white/60 text-sm">
                                  {service.duration} min • ${service.price}
                                </p>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "bg-pink-500 border-pink-500"
                                    : "border-white/40"
                                }`}
                              >
                                {isSelected && (
                                  <CheckCircle className="h-4 w-4 text-white" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <Label className="text-white">Special Requests (optional)</Label>
              <Textarea
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="Any special requests or notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <Button
              className="w-full h-14 text-lg bg-pink-600 hover:bg-pink-700"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Joining Waitlist..." : "Join Waitlist"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
