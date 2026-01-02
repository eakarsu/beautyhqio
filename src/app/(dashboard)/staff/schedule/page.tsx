"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Save, Plus, Trash2 } from "lucide-react";

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

interface Break {
  id?: string;
  startTime: string;
  endTime: string;
  label?: string;
}

interface Schedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
  breaks: Break[];
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StaffSchedulePage() {
  const { data: session } = useSession();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [myStaffProfile, setMyStaffProfile] = useState<Staff | null>(null);

  // Check if current user is a STAFF role (not manager/owner)
  const isStaffRole = session?.user?.role === "STAFF";

  useEffect(() => {
    if (isStaffRole) {
      fetchMySchedule();
    } else {
      fetchStaff();
    }
  }, [isStaffRole]);

  useEffect(() => {
    if (selectedStaffId && !isStaffRole) {
      fetchSchedule(selectedStaffId);
    }
  }, [selectedStaffId, isStaffRole]);

  const fetchMySchedule = async () => {
    try {
      const response = await fetch("/api/staff/me");
      if (response.ok) {
        const data = await response.json();
        setMyStaffProfile(data);
        if (data.schedules && data.schedules.length > 0) {
          setSchedules(data.schedules);
        }
      }
    } catch (error) {
      console.error("Error fetching my schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        setSchedules(data || []);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  };

  const handleSave = async () => {
    const staffId = isStaffRole ? myStaffProfile?.id : selectedStaffId;
    if (!staffId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });
      if (response.ok) {
        // Success
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get shifts for a specific day
  const getShiftsForDay = (dayOfWeek: number) => {
    return schedules.filter((s) => s.dayOfWeek === dayOfWeek && s.isWorking);
  };

  // Add a new shift for a day
  const addShift = (dayOfWeek: number) => {
    const newShift: Schedule = {
      dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
      isWorking: true,
      breaks: [],
    };
    setSchedules([...schedules, newShift]);
  };

  // Remove a shift
  const removeShift = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  // Update a shift
  const updateShift = (index: number, updates: Partial<Schedule>) => {
    setSchedules(
      schedules.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  // Add a break to a shift
  const addBreak = (shiftIndex: number) => {
    const newBreak: Break = {
      startTime: "12:00",
      endTime: "13:00",
    };
    setSchedules(
      schedules.map((s, i) =>
        i === shiftIndex ? { ...s, breaks: [...(s.breaks || []), newBreak] } : s
      )
    );
  };

  // Remove a break from a shift
  const removeBreak = (shiftIndex: number, breakIndex: number) => {
    setSchedules(
      schedules.map((s, i) =>
        i === shiftIndex
          ? { ...s, breaks: s.breaks.filter((_, bi) => bi !== breakIndex) }
          : s
      )
    );
  };

  // Update a break
  const updateBreak = (shiftIndex: number, breakIndex: number, updates: Partial<Break>) => {
    setSchedules(
      schedules.map((s, i) =>
        i === shiftIndex
          ? {
              ...s,
              breaks: s.breaks.map((b, bi) =>
                bi === breakIndex ? { ...b, ...updates } : b
              ),
            }
          : s
      )
    );
  };

  // Get the index of a shift in the schedules array
  const getShiftIndex = (dayOfWeek: number, shiftIndex: number) => {
    let count = 0;
    for (let i = 0; i < schedules.length; i++) {
      if (schedules[i].dayOfWeek === dayOfWeek && schedules[i].isWorking) {
        if (count === shiftIndex) return i;
        count++;
      }
    }
    return -1;
  };

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  const getStaffName = (staff: Staff) => {
    return staff.displayName || `${staff.user.firstName} ${staff.user.lastName}`;
  };

  const getInitials = (staff: Staff) => {
    return `${staff.user.firstName[0]}${staff.user.lastName[0]}`;
  };

  // Render schedule editor (used by both staff and managers)
  const renderScheduleEditor = () => (
    <div className="space-y-6">
      {DAYS.map((dayName, dayOfWeek) => {
        const shifts = getShiftsForDay(dayOfWeek);
        return (
          <div key={dayOfWeek} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{dayName}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addShift(dayOfWeek)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Shift
              </Button>
            </div>

            {shifts.length === 0 ? (
              <p className="text-muted-foreground text-sm py-2">No shifts - Day off</p>
            ) : (
              <div className="space-y-3">
                {shifts.map((shift, shiftIndex) => {
                  const actualIndex = getShiftIndex(dayOfWeek, shiftIndex);
                  return (
                    <div
                      key={shiftIndex}
                      className="p-4 bg-muted/50 rounded-lg space-y-3"
                    >
                      {/* Shift time row */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={shift.startTime}
                            onChange={(e) =>
                              updateShift(actualIndex, { startTime: e.target.value })
                            }
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={shift.endTime}
                            onChange={(e) =>
                              updateShift(actualIndex, { endTime: e.target.value })
                            }
                            className="w-32"
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeShift(actualIndex)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Breaks section */}
                      <div className="pl-6 border-l-2 border-muted-foreground/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Breaks</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addBreak(actualIndex)}
                            className="h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Break
                          </Button>
                        </div>

                        {(!shift.breaks || shift.breaks.length === 0) ? (
                          <p className="text-xs text-muted-foreground">No breaks scheduled</p>
                        ) : (
                          <div className="space-y-2">
                            {shift.breaks.map((breakItem, breakIndex) => (
                              <div key={breakIndex} className="flex items-center gap-2">
                                <Input
                                  type="time"
                                  value={breakItem.startTime}
                                  onChange={(e) =>
                                    updateBreak(actualIndex, breakIndex, { startTime: e.target.value })
                                  }
                                  className="w-28 h-8"
                                />
                                <span className="text-muted-foreground text-sm">-</span>
                                <Input
                                  type="time"
                                  value={breakItem.endTime}
                                  onChange={(e) =>
                                    updateBreak(actualIndex, breakIndex, { endTime: e.target.value })
                                  }
                                  className="w-28 h-8"
                                />
                                <Input
                                  type="text"
                                  value={breakItem.label || ""}
                                  placeholder="Label (optional)"
                                  onChange={(e) =>
                                    updateBreak(actualIndex, breakIndex, { label: e.target.value })
                                  }
                                  className="w-32 h-8 text-sm"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeBreak(actualIndex, breakIndex)}
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // For STAFF role - show their own schedule with editing capability
  if (isStaffRole) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Schedule</h1>
            <p className="text-muted-foreground">Set your working hours for the week</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || !myStaffProfile}
            className="bg-rose-600 hover:bg-rose-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
            <CardDescription>
              Add multiple shifts per day if needed (e.g., morning and afternoon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              renderScheduleEditor()
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // For managers/owners - show full management interface
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
            <CardDescription>
              Add multiple shifts per day if needed (e.g., morning and afternoon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedStaffId ? (
              <div className="text-center py-12 text-muted-foreground">
                Select a staff member to edit their schedule
              </div>
            ) : (
              renderScheduleEditor()
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
