"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Save, Plus, X } from "lucide-react";

interface Staff {
  id: string;
  displayName?: string;
  color?: string;
  user: {
    firstName: string;
    lastName: string;
  };
  schedules: Schedule[];
}

interface Schedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isWorking: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_SCHEDULE: Schedule[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "17:00",
  isWorking: i !== 0, // Sunday off by default
}));

export default function StaffSchedulePage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [schedules, setSchedules] = useState<Schedule[]>(DEFAULT_SCHEDULE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedStaffId) {
      fetchSchedule(selectedStaffId);
    }
  }, [selectedStaffId]);

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/staff");
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
        if (data.length > 0) {
          setSelectedStaffId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchedule = async (staffId: string) => {
    try {
      const response = await fetch(`/api/staff/${staffId}/schedule`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          // Merge with default schedule to ensure all days exist
          const merged = DEFAULT_SCHEDULE.map((defaultDay) => {
            const existingDay = data.find((s: Schedule) => s.dayOfWeek === defaultDay.dayOfWeek);
            return existingDay || defaultDay;
          });
          setSchedules(merged);
        } else {
          setSchedules(DEFAULT_SCHEDULE);
        }
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/staff/${selectedStaffId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });
      if (response.ok) {
        // Show success toast
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSchedule = (dayIndex: number, updates: Partial<Schedule>) => {
    setSchedules((prev) =>
      prev.map((s, i) => (i === dayIndex ? { ...s, ...updates } : s))
    );
  };

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  const getStaffName = (staff: Staff) => {
    return staff.displayName || `${staff.user.firstName} ${staff.user.lastName}`;
  };

  const getInitials = (staff: Staff) => {
    return `${staff.user.firstName[0]}${staff.user.lastName[0]}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Schedules</h1>
          <p className="text-muted-foreground">Manage working hours for your team</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !selectedStaffId}
          className="bg-rose-600 hover:bg-rose-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Staff List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Team Members</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : (
              <div className="divide-y">
                {staffList.map((staff) => (
                  <button
                    key={staff.id}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left ${
                      selectedStaffId === staff.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedStaffId(staff.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback style={{ backgroundColor: staff.color || "#f43f5e" }}>
                        {getInitials(staff)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{getStaffName(staff)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Editor */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedStaff ? `${getStaffName(selectedStaff)}'s Schedule` : "Select a Staff Member"}
            </CardTitle>
            <CardDescription>Set working hours for each day of the week</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedStaffId ? (
              <div className="text-center py-12 text-muted-foreground">
                Select a staff member to edit their schedule
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      schedule.isWorking ? "bg-white" : "bg-muted/50"
                    }`}
                  >
                    <div className="w-28">
                      <div className="font-medium">{DAYS[schedule.dayOfWeek]}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={schedule.isWorking}
                        onCheckedChange={(checked) =>
                          updateSchedule(index, { isWorking: checked })
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {schedule.isWorking ? "Working" : "Off"}
                      </span>
                    </div>

                    {schedule.isWorking && (
                      <>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) =>
                              updateSchedule(index, { startTime: e.target.value })
                            }
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) =>
                              updateSchedule(index, { endTime: e.target.value })
                            }
                            className="w-32"
                          />
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-sm text-muted-foreground">Break:</span>
                          <Input
                            type="time"
                            value={schedule.breakStart || ""}
                            onChange={(e) =>
                              updateSchedule(index, { breakStart: e.target.value })
                            }
                            className="w-28"
                            placeholder="Start"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={schedule.breakEnd || ""}
                            onChange={(e) =>
                              updateSchedule(index, { breakEnd: e.target.value })
                            }
                            className="w-28"
                            placeholder="End"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
