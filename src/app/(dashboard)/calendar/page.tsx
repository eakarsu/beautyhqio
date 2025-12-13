"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Clock,
  AlertTriangle,
  Brain,
  Sparkles,
  Loader2,
  Calendar,
} from "lucide-react";
import { formatTime, getInitials } from "@/lib/utils";

const timeSlots = Array.from({ length: 26 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minutes}`;
});

interface Staff {
  id: string;
  displayName: string | null;
  title: string | null;
  color: string | null;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Appointment {
  id: string;
  clientName: string | null;
  client: {
    firstName: string;
    lastName: string;
  } | null;
  staffId: string;
  staff: {
    displayName: string | null;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  services: Array<{
    service: {
      name: string;
    };
  }>;
}

interface WaitlistEntry {
  id: string;
  clientName: string;
  serviceName: string;
  estimatedWait: number;
}

interface NoShowPrediction {
  riskLevel: "low" | "medium" | "high";
  probability: number;
  reasons: string[];
  recommendations: string[];
  clientInfo?: {
    id: string;
    name: string;
  };
}

export default function CalendarPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<NoShowPrediction | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];

      const [staffRes, appointmentsRes, waitlistRes] = await Promise.all([
        fetch("/api/staff?isActive=true"),
        fetch(`/api/appointments?date=${dateStr}`),
        fetch("/api/waitlist"),
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData);
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData);
      }

      if (waitlistRes.ok) {
        const waitlistData = await waitlistRes.json();
        // Transform to expected format
        const formattedWaitlist = (Array.isArray(waitlistData) ? waitlistData : []).map((entry: any) => ({
          id: entry.id,
          clientName: entry.client ? `${entry.client.firstName} ${entry.client.lastName}` : "Walk-in",
          serviceName: entry.serviceNotes || "Service",
          estimatedWait: entry.estimatedWait || 15,
        }));
        setWaitlistEntries(formattedWaitlist);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeNoShowRisk = async (appointmentId: string) => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/no-show-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPrediction({
          ...data.prediction,
          clientInfo: data.clientInfo,
        });
      }
    } catch (error) {
      console.error("Failed to analyze no-show risk:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const formatDateHeader = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getAppointmentPosition = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate.getHours() + endDate.getMinutes() / 60;
    const top = (startHour - 8) * 60; // 8am start, 60px per hour
    const height = Math.max((endHour - startHour) * 60, 30); // Minimum 30px height
    return { top, height };
  };

  const getStaffName = (staffMember: Staff) => {
    return staffMember.displayName || `${staffMember.user.firstName} ${staffMember.user.lastName.charAt(0)}.`;
  };

  const getStaffColor = (staffMember: Staff) => {
    return staffMember.color || "#6366f1"; // Default to indigo
  };

  const getClientName = (apt: Appointment) => {
    if (apt.client) {
      return `${apt.client.firstName} ${apt.client.lastName}`;
    }
    return apt.clientName || "Walk-in";
  };

  const getServiceNames = (apt: Appointment) => {
    if (apt.services && apt.services.length > 0) {
      return apt.services.map(s => s.service.name).join(", ");
    }
    return "Service";
  };

  const getStatusColor = () => {
    // All appointments have the same appearance like Nicole Brown's style
    // Solid light green background with dark text for good contrast
    return "bg-green-200 text-green-900";
  };

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.setDate(selectedDate.getDate() - 1))
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[200px] text-center">
              {formatDateHeader(selectedDate)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.setDate(selectedDate.getDate() + 1))
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(v) => setView(v as "day" | "week")}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
          <Button onClick={() => router.push("/appointments/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)]">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex">
              {/* Time column */}
              <div className="w-16 flex-shrink-0 border-r bg-slate-50">
                <div className="h-12 border-b" /> {/* Header space */}
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="h-[30px] border-b text-xs text-slate-500 pr-2 text-right pt-0.5"
                  >
                    {time.endsWith("00") ? time : ""}
                  </div>
                ))}
              </div>

              {/* Staff columns */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex min-w-[800px]">
                  {isLoading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                    </div>
                  ) : staff.length > 0 ? (
                    staff.map((staffMember) => (
                      <div key={staffMember.id} className="flex-1 min-w-[160px]">
                        {/* Staff header */}
                        <div className="h-12 border-b flex items-center justify-center gap-2 px-2 bg-slate-50">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback
                              style={{ backgroundColor: getStaffColor(staffMember) }}
                              className="text-white text-xs"
                            >
                              {getInitials(staffMember.user.firstName, staffMember.user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm font-medium truncate">
                            {getStaffName(staffMember)}
                          </div>
                        </div>

                        {/* Time slots */}
                        <div className="relative">
                          {timeSlots.map((time) => (
                            <div
                              key={time}
                              className="h-[30px] border-b border-r border-dashed hover:bg-slate-50 cursor-pointer"
                            />
                          ))}

                          {/* Appointments */}
                          {appointments
                            .filter((apt) => apt.staffId === staffMember.id)
                            .map((apt) => {
                              const pos = getAppointmentPosition(apt.scheduledStart, apt.scheduledEnd);
                              return (
                                <div
                                  key={apt.id}
                                  className={`absolute left-1 right-1 rounded-lg border-l-4 p-2 cursor-pointer hover:shadow-lg transition-shadow ${getStatusColor()}`}
                                  style={{
                                    top: `${pos.top}px`,
                                    minHeight: `${pos.height}px`,
                                    borderLeftColor: getStaffColor(staffMember),
                                  }}
                                  onClick={() => router.push(`/appointments/${apt.id}`)}
                                >
                                  <p className="text-sm font-semibold leading-tight">
                                    {getClientName(apt)}
                                  </p>
                                  <p className="text-sm leading-tight">
                                    {getServiceNames(apt)}
                                  </p>
                                  <p className="text-xs leading-tight">
                                    {formatTime(new Date(apt.scheduledStart))} - {formatTime(new Date(apt.scheduledEnd))}
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500">
                      <Calendar className="h-12 w-12 mb-3 text-slate-300" />
                      <p>No staff members found</p>
                      <Button variant="link" onClick={() => router.push("/staff")} className="mt-2 text-rose-600">
                        Add staff members
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Walk-in Queue */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Walk-in Queue
                </CardTitle>
                <Badge variant="secondary">{waitlistEntries.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {waitlistEntries.length > 0 ? (
                  waitlistEntries.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{entry.clientName}</p>
                          <p className="text-xs text-slate-500">{entry.serviceName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        ~{entry.estimatedWait} min
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2">No walk-ins waiting</p>
                )}
              </div>
              <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => router.push("/calendar/waitlist")}>
                Add Walk-in
              </Button>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-300" />
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span>Checked In</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span>In Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff on Duty */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Staff on Duty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {staff.length > 0 ? (
                  staff.map((staffMember) => (
                    <div
                      key={staffMember.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getStaffColor(staffMember) }}
                      />
                      <span>{getStaffName(staffMember)}</span>
                      <span className="text-xs text-slate-500">
                        ({staffMember.title || "Staff"})
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2">No staff available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI No-Show Risk Alert */}
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-amber-600" />
                AI No-Show Risk Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appointments.length > 0 ? (
                  appointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className="p-2 rounded-lg bg-white border border-amber-100 cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => analyzeNoShowRisk(apt.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{getClientName(apt)}</span>
                        <Badge variant="secondary" className="text-xs">
                          Analyze
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{getServiceNames(apt)}</span>
                        <span>{formatTime(new Date(apt.scheduledStart))}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2">No appointments to analyze</p>
                )}
              </div>
              {appointments.length > 0 && (
                <p className="text-xs text-amber-700 mt-3 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Click to see AI analysis
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI Prediction Modal/Card */}
          {selectedPrediction && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    AI Analysis
                  </CardTitle>
                  <button
                    onClick={() => setSelectedPrediction(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    &times;
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {aiLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-full ${
                          selectedPrediction.riskLevel === "high"
                            ? "bg-red-100"
                            : selectedPrediction.riskLevel === "medium"
                            ? "bg-amber-100"
                            : "bg-green-100"
                        }`}
                      >
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            selectedPrediction.riskLevel === "high"
                              ? "text-red-600"
                              : selectedPrediction.riskLevel === "medium"
                              ? "text-amber-600"
                              : "text-green-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {selectedPrediction.riskLevel} Risk
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedPrediction.probability}% probability
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-1">
                        Reasons:
                      </p>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {selectedPrediction.reasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-purple-500">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-1">
                        Recommendations:
                      </p>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {selectedPrediction.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-green-500">✓</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button size="sm" className="w-full text-xs" onClick={() => router.push("/marketing?action=reminder")}>
                      Send Reminder Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
