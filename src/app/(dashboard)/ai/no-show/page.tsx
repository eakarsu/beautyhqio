"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  User,
  CheckCircle,
  XCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface RiskyAppointment {
  id: string;
  riskScore: number;
  riskFactors: string[];
  scheduledStart: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    noShowCount: number;
    totalAppointments: number;
  };
  staff: {
    displayName: string;
  };
  services: Array<{ service: { name: string } }>;
  isConfirmed: boolean;
  reminderSent: boolean;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface AIPrediction {
  riskScore: number;
  riskLevel: string;
  factors: string[];
  recommendations: string[];
  suggestedActions: string[];
}

export default function NoShowPredictorPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<RiskyAppointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<AIPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAtRisk: 0,
    highRisk: 0,
    mediumRisk: 0,
    confirmed: 0,
  });

  useEffect(() => {
    fetchClients();
    refreshWithAI();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients?limit=50");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // AI-powered refresh using OpenRouter
  const refreshWithAI = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First get upcoming appointments
      const response = await fetch("/api/ai/no-show-prediction");
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      const baseAppointments = data.appointments || [];

      // Now get AI predictions for each appointment using OpenRouter
      const appointmentsWithAI = await Promise.all(
        baseAppointments.slice(0, 10).map(async (apt: RiskyAppointment) => {
          try {
            const aiResponse = await fetch("/api/ai/no-show-prediction", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clientId: apt.client.id }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              return {
                ...apt,
                riskScore: aiData.prediction?.riskScore || apt.riskScore,
                riskFactors: aiData.prediction?.factors || apt.riskFactors,
              };
            }
          } catch (err) {
            console.error("AI prediction error for", apt.client.firstName, err);
          }
          return apt;
        })
      );

      setAppointments(appointmentsWithAI);

      // Recalculate stats
      const highRisk = appointmentsWithAI.filter((a) => a.riskScore >= 0.7).length;
      const mediumRisk = appointmentsWithAI.filter((a) => a.riskScore >= 0.4 && a.riskScore < 0.7).length;
      const confirmed = appointmentsWithAI.filter((a) => a.isConfirmed).length;

      setStats({
        totalAtRisk: appointmentsWithAI.length,
        highRisk,
        mediumRisk,
        confirmed,
      });
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setError("Failed to fetch AI predictions");
    } finally {
      setIsLoading(false);
    }
  };

  // AI-powered analysis using OpenRouter
  const analyzeWithAI = async () => {
    if (!selectedClientId) {
      setError("Please select a client to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAiPrediction(null);

    try {
      const response = await fetch("/api/ai/no-show-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClientId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze");
      }

      // Map API response to UI format
      setAiPrediction({
        riskScore: data.prediction?.riskScore || 0.5,
        riskLevel: data.prediction?.riskLevel || "Medium",
        factors: data.prediction?.factors || [],
        recommendations: data.prediction?.recommendations || [],
        suggestedActions: data.prediction?.suggestedActions || [
          "Send confirmation reminder",
          "Offer flexible rescheduling",
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendReminder = async (appointmentId: string) => {
    try {
      await fetch(`/api/sms/reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      refreshWithAI();
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { label: "High Risk", color: "bg-red-100 text-red-800" };
    if (score >= 0.4) return { label: "Medium Risk", color: "bg-amber-100 text-amber-800" };
    return { label: "Low Risk", color: "bg-green-100 text-green-800" };
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/ai")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">No-Show Predictor</h1>
            <p className="text-muted-foreground">
              AI-powered prediction of appointment no-show risks
            </p>
          </div>
        </div>
        <Button onClick={refreshWithAI} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Refresh Predictions
            </>
          )}
        </Button>
      </div>

      {/* AI Analysis Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Analysis
          </CardTitle>
          <CardDescription>
            Select a client to get detailed AI predictions using OpenRouter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Selector */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={analyzeWithAI}
                disabled={isAnalyzing || !selectedClientId}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Prediction
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* AI Prediction Results */}
            <div>
              {aiPrediction ? (
                <div className="space-y-4">
                  {/* Risk Score */}
                  <div className={`p-4 rounded-lg ${
                    aiPrediction.riskLevel === "High" ? "bg-red-50 border-red-200" :
                    aiPrediction.riskLevel === "Medium" ? "bg-amber-50 border-amber-200" :
                    "bg-green-50 border-green-200"
                  } border`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{aiPrediction.riskLevel} Risk</p>
                        <p className="text-sm text-slate-600">
                          {Math.round(aiPrediction.riskScore * 100)}% probability of no-show
                        </p>
                      </div>
                      <div className="text-3xl font-bold">
                        {Math.round(aiPrediction.riskScore * 100)}%
                      </div>
                    </div>
                    <Progress value={aiPrediction.riskScore * 100} className="mt-2 h-2" />
                  </div>

                  {/* Risk Factors */}
                  {aiPrediction.factors.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Risk Factors</Label>
                      <ul className="mt-2 space-y-1">
                        {aiPrediction.factors.map((factor, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {aiPrediction.recommendations.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">AI Recommendations</Label>
                      <ul className="mt-2 space-y-1">
                        {aiPrediction.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Select a client and click "Get AI Prediction"</p>
                  <p className="text-sm mt-1">for detailed analysis</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalAtRisk}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.highRisk}</div>
                <div className="text-sm text-muted-foreground">High Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.mediumRisk}</div>
                <div className="text-sm text-muted-foreground">Medium Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.confirmed}</div>
                <div className="text-sm text-muted-foreground">Confirmed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            Appointments sorted by risk level (quick local calculation)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
              Analyzing appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">No upcoming appointments</p>
              <p className="text-sm mt-1">Click "Load Sample" to see demo data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments
                .sort((a, b) => b.riskScore - a.riskScore)
                .map((apt) => {
                  const risk = getRiskLevel(apt.riskScore);
                  return (
                    <div key={apt.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="text-center min-w-[80px]">
                            <div className="text-lg font-bold">
                              {format(new Date(apt.scheduledStart), "h:mm a")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(apt.scheduledStart), "MMM d")}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {apt.client.firstName} {apt.client.lastName}
                              </span>
                              <Badge className={risk.color}>{risk.label}</Badge>
                              {apt.isConfirmed && (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirmed
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {apt.services.map((s) => s.service.name).join(", ")} with{" "}
                              {apt.staff.displayName}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {apt.client.phone}
                              </span>
                              {apt.client.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {apt.client.email}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {apt.client.noShowCount} no-shows / {apt.client.totalAppointments} visits
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-rose-600">
                            {Math.round(apt.riskScore * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">risk score</div>
                        </div>
                      </div>

                      {/* Risk Factors */}
                      {apt.riskFactors.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium mb-2">Risk Factors:</div>
                          <div className="flex flex-wrap gap-2">
                            {apt.riskFactors.map((factor, i) => (
                              <Badge key={i} variant="secondary">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <Progress value={apt.riskScore * 100} className="h-2" />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(apt.id)}
                          disabled={apt.reminderSent}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {apt.reminderSent ? "Reminder Sent" : "Send Reminder"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${apt.client.phone.replace(/\D/g, '')}`, '_self')}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClientId(apt.client.id);
                            analyzeWithAI();
                          }}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI Analysis
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
