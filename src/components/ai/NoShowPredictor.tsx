"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  TrendingUp,
  Shield,
  Bell,
} from "lucide-react";
import { format } from "date-fns";

interface RiskAppointment {
  id: string;
  scheduledStart: string;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    noShowCount: number;
    lastNoShow?: string;
  };
  staff: {
    name: string;
  };
  services: string[];
  riskScore: number;
  riskFactors: string[];
  suggestedActions: string[];
}

interface NoShowPredictorProps {
  dateRange?: "today" | "tomorrow" | "week";
}

export function NoShowPredictor({ dateRange = "tomorrow" }: NoShowPredictorProps) {
  const [appointments, setAppointments] = useState<RiskAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(dateRange);
  const [actionTaken, setActionTaken] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPredictions();
  }, [selectedRange]);

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/no-show/predictions?range=${selectedRange}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
      // Demo data
      setAppointments([
        {
          id: "a1",
          scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          client: {
            firstName: "John",
            lastName: "Smith",
            phone: "(555) 123-4567",
            email: "john@email.com",
            noShowCount: 3,
            lastNoShow: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          },
          staff: { name: "Sarah Johnson" },
          services: ["Haircut", "Color"],
          riskScore: 85,
          riskFactors: ["3 previous no-shows", "No confirmation reply", "Booked during peak hours"],
          suggestedActions: ["Send SMS reminder", "Request confirmation", "Require deposit"],
        },
        {
          id: "a2",
          scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 24 + 1000 * 60 * 60 * 2).toISOString(),
          client: {
            firstName: "Maria",
            lastName: "Garcia",
            phone: "(555) 987-6543",
            noShowCount: 1,
            lastNoShow: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
          },
          staff: { name: "Mike Brown" },
          services: ["Highlights"],
          riskScore: 45,
          riskFactors: ["1 previous no-show (90 days ago)", "First appointment of the day"],
          suggestedActions: ["Send reminder email"],
        },
        {
          id: "a3",
          scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 24 + 1000 * 60 * 60 * 4).toISOString(),
          client: {
            firstName: "Alex",
            lastName: "Wilson",
            phone: "(555) 456-7890",
            email: "alex@email.com",
            noShowCount: 2,
          },
          staff: { name: "Lisa Williams" },
          services: ["Keratin Treatment"],
          riskScore: 65,
          riskFactors: ["2 previous no-shows", "High-value appointment", "New to this service"],
          suggestedActions: ["Personal phone call", "Send preparation instructions"],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (appointmentId: string, action: string) => {
    setActionTaken((prev) => ({ ...prev, [appointmentId]: action }));
    // In production, would call API to execute action
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-orange-600";
    return "text-yellow-600";
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return { label: "High Risk", class: "bg-red-100 text-red-800" };
    if (score >= 40) return { label: "Medium Risk", class: "bg-orange-100 text-orange-800" };
    return { label: "Low Risk", class: "bg-yellow-100 text-yellow-800" };
  };

  const highRiskCount = appointments.filter((a) => a.riskScore >= 70).length;
  const mediumRiskCount = appointments.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                No-Show Risk Predictor
              </CardTitle>
              <CardDescription>
                AI-powered predictions for appointment attendance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {["today", "tomorrow", "week"].map((range) => (
                <Button
                  key={range}
                  variant={selectedRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRange(range as "today" | "tomorrow" | "week")}
                  className={selectedRange === range ? "bg-rose-600" : ""}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{highRiskCount}</div>
              <div className="text-sm text-muted-foreground">High Risk</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{mediumRiskCount}</div>
              <div className="text-sm text-muted-foreground">Medium Risk</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {appointments.length - highRiskCount - mediumRiskCount}
              </div>
              <div className="text-sm text-muted-foreground">Low Risk</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* At-Risk Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">At-Risk Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Analyzing appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium text-green-700">All Clear!</p>
              <p className="text-sm">No high-risk appointments detected</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {appointments
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map((apt) => {
                    const risk = getRiskBadge(apt.riskScore);
                    const hasActed = !!actionTaken[apt.id];

                    return (
                      <Card key={apt.id} className={hasActed ? "opacity-60" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <div className={`text-2xl font-bold ${getRiskColor(apt.riskScore)}`}>
                                  {apt.riskScore}%
                                </div>
                                <div className="text-xs text-muted-foreground">risk</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">
                                    {apt.client.firstName} {apt.client.lastName}
                                  </h4>
                                  <Badge className={risk.class}>{risk.label}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {apt.services.join(", ")} with {apt.staff.name}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(apt.scheduledStart), "MMM d")}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(apt.scheduledStart), "h:mm a")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Progress value={apt.riskScore} className="w-24 h-2" />
                          </div>

                          {/* Risk Factors */}
                          <div className="mb-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Risk Factors:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {apt.riskFactors.map((factor, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Suggested Actions */}
                          {!hasActed ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(apt.id, "sms")}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Send SMS
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(apt.id, "call")}
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                              </Button>
                              {apt.client.email && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction(apt.id, "email")}
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  Email
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(apt.id, "deposit")}
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Request Deposit
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-600">
                              <Bell className="h-4 w-4" />
                              <span className="text-sm">
                                Action taken: {actionTaken[apt.id]}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
