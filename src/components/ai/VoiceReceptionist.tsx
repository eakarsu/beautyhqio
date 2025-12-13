"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  Volume2,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
} from "lucide-react";
import { format } from "date-fns";

interface CallLog {
  id: string;
  callerNumber: string;
  callerName?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  outcome: "booked" | "transferred" | "voicemail" | "dropped" | "in_progress";
  notes?: string;
  appointmentId?: string;
}

interface VoiceReceptionistProps {
  isEnabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

export function VoiceReceptionist({ isEnabled = true, onToggle }: VoiceReceptionistProps) {
  const [enabled, setEnabled] = useState(isEnabled);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCalls: 0,
    bookedAppointments: 0,
    avgCallDuration: 0,
    missedCalls: 0,
  });

  useEffect(() => {
    fetchCallLogs();
  }, []);

  const fetchCallLogs = async () => {
    try {
      const response = await fetch("/api/ai/voice/calls");
      if (response.ok) {
        const data = await response.json();
        setCallLogs(data.calls);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching call logs:", error);
      // Demo data
      setCallLogs([
        {
          id: "c1",
          callerNumber: "(555) 123-4567",
          callerName: "Jane Doe",
          startTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          endTime: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          duration: 180,
          outcome: "booked",
          notes: "Booked haircut for tomorrow at 2pm",
          appointmentId: "apt123",
        },
        {
          id: "c2",
          callerNumber: "(555) 987-6543",
          startTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          endTime: new Date(Date.now() - 1000 * 60 * 43).toISOString(),
          duration: 120,
          outcome: "transferred",
          notes: "Pricing question - transferred to manager",
        },
        {
          id: "c3",
          callerNumber: "(555) 456-7890",
          callerName: "John Smith",
          startTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          outcome: "voicemail",
          notes: "Left voicemail about rescheduling",
        },
        {
          id: "c4",
          callerNumber: "(555) 111-2222",
          startTime: new Date().toISOString(),
          outcome: "in_progress",
        },
      ]);
      setStats({
        totalCalls: 47,
        bookedAppointments: 23,
        avgCallDuration: 145,
        missedCalls: 3,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    onToggle?.(value);
  };

  const getOutcomeIcon = (outcome: CallLog["outcome"]) => {
    switch (outcome) {
      case "booked":
        return <Calendar className="h-4 w-4 text-green-600" />;
      case "transferred":
        return <PhoneCall className="h-4 w-4 text-blue-600" />;
      case "voicemail":
        return <Volume2 className="h-4 w-4 text-orange-600" />;
      case "dropped":
        return <PhoneOff className="h-4 w-4 text-red-600" />;
      case "in_progress":
        return <Mic className="h-4 w-4 text-purple-600 animate-pulse" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getOutcomeBadge = (outcome: CallLog["outcome"]) => {
    const config = {
      booked: { label: "Booked", class: "bg-green-100 text-green-800" },
      transferred: { label: "Transferred", class: "bg-blue-100 text-blue-800" },
      voicemail: { label: "Voicemail", class: "bg-orange-100 text-orange-800" },
      dropped: { label: "Dropped", class: "bg-red-100 text-red-800" },
      in_progress: { label: "Active", class: "bg-purple-100 text-purple-800" },
    };
    const { label, class: className } = config[outcome];
    return <Badge className={className}>{label}</Badge>;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                AI Voice Receptionist
              </CardTitle>
              <CardDescription>
                Automated phone answering and booking
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="voice-toggle" className="text-sm">
                {enabled ? "Active" : "Disabled"}
              </Label>
              <Switch
                id="voice-toggle"
                checked={enabled}
                onCheckedChange={handleToggle}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{stats.totalCalls}</div>
              <div className="text-sm text-muted-foreground">Total Calls</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {stats.bookedAppointments}
              </div>
              <div className="text-sm text-muted-foreground">Appointments Booked</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">
                {formatDuration(stats.avgCallDuration)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">
                {stats.missedCalls}
              </div>
              <div className="text-sm text-muted-foreground">Missed Calls</div>
            </div>
          </div>

          {/* Active Call Alert */}
          {callLogs.some((c) => c.outcome === "in_progress") && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <Mic className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-purple-900">Active Call in Progress</p>
                <p className="text-sm text-purple-700">
                  {callLogs.find((c) => c.outcome === "in_progress")?.callerNumber}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Listen Live
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading call logs...
            </div>
          ) : callLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No calls yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {callLogs.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      {getOutcomeIcon(call.outcome)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {call.callerName || "Unknown Caller"}
                        </span>
                        {getOutcomeBadge(call.outcome)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {call.callerNumber}
                      </p>
                      {call.notes && (
                        <p className="text-sm mt-1">{call.notes}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(call.startTime), "h:mm a")}
                        </span>
                        {call.duration && (
                          <span>Duration: {formatDuration(call.duration)}</span>
                        )}
                      </div>
                    </div>
                    {call.appointmentId && (
                      <Button variant="outline" size="sm">
                        View Booking
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
