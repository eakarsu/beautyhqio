"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Sparkles,
  Star,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Loader2,
} from "lucide-react";
import ClientSelector from "@/components/ai/ClientSelector";
import { AIResponseCard, ConfidenceMeter, RecommendationList } from "@/components/ai/AIResponseCard";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface SchedulingResult {
  recommendedSlots: Array<{
    date: string;
    time: string;
    staff: string;
    services: string[];
    totalDuration: number;
    reason: string;
    confidence: number;
  }>;
  staffRecommendations: Array<{
    staff: string;
    specialty: string;
    matchScore: number;
    reason: string;
  }>;
  optimizationTips: string[];
  alternativeOptions: string[];
  peakTimeWarning: string | null;
}

const services = [
  { id: "haircut", name: "Haircut", duration: 45 },
  { id: "color", name: "Hair Color", duration: 120 },
  { id: "balayage", name: "Balayage", duration: 180 },
  { id: "blowout", name: "Blowout", duration: 30 },
  { id: "manicure", name: "Manicure", duration: 30 },
  { id: "pedicure", name: "Pedicure", duration: 45 },
  { id: "facial", name: "Facial", duration: 60 },
  { id: "massage", name: "Massage", duration: 60 },
];

const staff = [
  { id: "1", name: "Sarah J.", specialty: "Color & Styling" },
  { id: "2", name: "Ashley W.", specialty: "Cuts & Blowouts" },
  { id: "3", name: "Michelle T.", specialty: "Nails" },
  { id: "4", name: "David C.", specialty: "Men's Grooming" },
  { id: "5", name: "Emma D.", specialty: "Skincare & Spa" },
];

export default function SmartSchedulingPage() {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [preferredStaff, setPreferredStaff] = useState<string>("");
  const [preferredTime, setPreferredTime] = useState<string>("");
  const [constraints, setConstraints] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SchedulingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleAnalyze = async () => {
    if (selectedServices.length === 0) {
      setError("Please select at least one service");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/smart-scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: selectedClient
            ? `${selectedClient.firstName} ${selectedClient.lastName}`
            : "New Client",
          preferredServices: selectedServices.map(
            (id) => services.find((s) => s.id === id)?.name || id
          ),
          preferredStaff: preferredStaff
            ? staff.find((s) => s.id === preferredStaff)?.name
            : null,
          preferredTime,
          constraints: constraints || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error || "Failed to analyze");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/ai")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Smart Scheduling</h1>
            <p className="text-sm text-slate-500">AI-powered appointment optimization</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scheduling Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Client</Label>
              <ClientSelector
                value={selectedClient}
                onChange={setSelectedClient}
                placeholder="Search for existing client..."
              />
              {!selectedClient && (
                <p className="text-xs text-slate-500">
                  Leave empty for new/walk-in clients
                </p>
              )}
            </div>

            {/* Services */}
            <div className="space-y-2">
              <Label>Services Needed *</Label>
              <div className="grid grid-cols-2 gap-2">
                {services.map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-rose-500 bg-rose-50"
                          : "hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(service.id)}
                        className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{service.name}</p>
                        <p className="text-xs text-slate-500">{service.duration} min</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Preferred Staff */}
            <div className="space-y-2">
              <Label>Preferred Staff (Optional)</Label>
              <Select value={preferredStaff} onValueChange={setPreferredStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Any available" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any available</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} - {s.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Time */}
            <div className="space-y-2">
              <Label>Preferred Time (Optional)</Label>
              <Select value={preferredTime} onValueChange={setPreferredTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Flexible" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                  <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                  <SelectItem value="weekend">Weekend Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Constraints */}
            <div className="space-y-2">
              <Label>Special Requirements (Optional)</Label>
              <Input
                placeholder="e.g., Need to be done by 3 PM, wheelchair accessible..."
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleAnalyze}
              disabled={loading || selectedServices.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding Best Slots...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find Optimal Appointments
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {result && (
            <>
              {/* Peak Time Warning */}
              {result.peakTimeWarning && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Peak Time Alert</p>
                    <p className="text-sm text-amber-700">{result.peakTimeWarning}</p>
                  </div>
                </div>
              )}

              {/* Recommended Slots */}
              <AIResponseCard
                title="Recommended Appointments"
                icon={<Calendar className="h-5 w-5 text-blue-500" />}
              >
                <div className="space-y-3">
                  {result.recommendedSlots.map((slot, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        index === 0 ? "border-green-300 bg-green-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Badge className="bg-green-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Best Match
                            </Badge>
                          )}
                          <span className="font-semibold">Option {index + 1}</span>
                        </div>
                        <ConfidenceMeter value={slot.confidence} />
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{slot.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>{slot.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>{slot.staff}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{slot.reason}</p>
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => router.push(`/calendar?book=${slot.date}`)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Book This Slot
                      </Button>
                    </div>
                  ))}
                </div>
              </AIResponseCard>

              {/* Staff Recommendations */}
              <AIResponseCard
                title="Staff Recommendations"
                icon={<User className="h-5 w-5 text-purple-500" />}
                expandable
              >
                <div className="space-y-3">
                  {result.staffRecommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                    >
                      <div>
                        <p className="font-medium">{rec.staff}</p>
                        <p className="text-sm text-slate-500">{rec.specialty}</p>
                        <p className="text-xs text-slate-400 mt-1">{rec.reason}</p>
                      </div>
                      <ConfidenceMeter value={rec.matchScore} label="Match" />
                    </div>
                  ))}
                </div>
              </AIResponseCard>

              {/* Optimization Tips */}
              <AIResponseCard
                title="Optimization Tips"
                icon={<Lightbulb className="h-5 w-5 text-amber-500" />}
                expandable
              >
                <RecommendationList items={result.optimizationTips} />
              </AIResponseCard>

              {/* Alternative Options */}
              {result.alternativeOptions.length > 0 && (
                <AIResponseCard
                  title="Alternative Options"
                  icon={<Sparkles className="h-5 w-5 text-rose-500" />}
                  expandable
                >
                  <ul className="space-y-2">
                    {result.alternativeOptions.map((option, index) => (
                      <li
                        key={index}
                        className="text-sm text-slate-600 flex items-start gap-2"
                      >
                        <span className="text-slate-400">•</span>
                        {option}
                      </li>
                    ))}
                  </ul>
                </AIResponseCard>
              )}
            </>
          )}

          {!result && !loading && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  AI Scheduling Assistant
                </h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Select services and preferences to get AI-powered appointment
                  recommendations optimized for your schedule.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
