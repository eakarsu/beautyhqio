"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

interface WorkingHours {
  day: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

interface Staff {
  id: string;
  displayName?: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function StaffSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [schedule, setSchedule] = useState<WorkingHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [staffRes, scheduleRes] = await Promise.all([
        fetch(`/api/staff/${id}`),
        fetch(`/api/staff/${id}/schedule`),
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData);
      }

      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        setSchedule(scheduleData);
      } else {
        // Default schedule
        setSchedule(
          DAYS_OF_WEEK.map((day) => ({
            day,
            isWorking: !["Saturday", "Sunday"].includes(day),
            startTime: "09:00",
            endTime: "17:00",
            breakStart: "12:00",
            breakEnd: "13:00",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Set default schedule on error
      setSchedule(
        DAYS_OF_WEEK.map((day) => ({
          day,
          isWorking: !["Saturday", "Sunday"].includes(day),
          startTime: "09:00",
          endTime: "17:00",
          breakStart: "12:00",
          breakEnd: "13:00",
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayName = () => {
    if (staff?.displayName) return staff.displayName;
    if (staff?.user) return `${staff.user.firstName} ${staff.user.lastName}`;
    return "Staff Member";
  };

  const updateScheduleDay = (day: string, updates: Partial<WorkingHours>) => {
    setSchedule((prev) =>
      prev.map((s) => (s.day === day ? { ...s, ...updates } : s))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/staff/${id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });

      if (response.ok) {
        router.push(`/staff/${id}`);
      } else {
        alert("Failed to save schedule");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/staff/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Schedule</h1>
            <p className="text-muted-foreground">{getDisplayName()}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Schedule"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedule.map((day) => (
            <div
              key={day.day}
              className={`flex items-center gap-4 p-4 border rounded-lg ${
                day.isWorking ? "bg-white" : "bg-muted/50"
              }`}
            >
              <div className="w-28">
                <span className="font-medium">{day.day}</span>
              </div>

              <Switch
                checked={day.isWorking}
                onCheckedChange={(checked) =>
                  updateScheduleDay(day.day, { isWorking: checked })
                }
              />

              {day.isWorking ? (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={day.startTime}
                      onChange={(e) =>
                        updateScheduleDay(day.day, { startTime: e.target.value })
                      }
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={day.endTime}
                      onChange={(e) =>
                        updateScheduleDay(day.day, { endTime: e.target.value })
                      }
                      className="w-32"
                    />
                  </div>

                  <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                    <span className="text-sm text-muted-foreground">Break:</span>
                    <Input
                      type="time"
                      value={day.breakStart || ""}
                      onChange={(e) =>
                        updateScheduleDay(day.day, { breakStart: e.target.value })
                      }
                      className="w-32"
                      placeholder="Start"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={day.breakEnd || ""}
                      onChange={(e) =>
                        updateScheduleDay(day.day, { breakEnd: e.target.value })
                      }
                      className="w-32"
                      placeholder="End"
                    />
                  </div>
                </div>
              ) : (
                <Badge variant="secondary" className="ml-4">
                  Day Off
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/staff/${id}`)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? "Saving..." : "Save Schedule"}
        </Button>
      </div>
    </div>
  );
}
