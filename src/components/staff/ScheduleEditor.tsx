"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Plus, Trash2, Copy, AlertCircle } from "lucide-react";

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  breaks?: Array<{ start: string; end: string }>;
}

interface ScheduleEditorProps {
  schedule: Record<string, DaySchedule>;
  onSave: (schedule: Record<string, DaySchedule>) => Promise<void>;
  staffName?: string;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  const label = hour > 12
    ? `${hour - 12}:${minute.toString().padStart(2, "0")} PM`
    : hour === 12
    ? `12:${minute.toString().padStart(2, "0")} PM`
    : `${hour}:${minute.toString().padStart(2, "0")} AM`;
  return { value: time, label };
});

export function ScheduleEditor({ schedule, onSave, staffName }: ScheduleEditorProps) {
  const [editedSchedule, setEditedSchedule] = useState<Record<string, DaySchedule>>(schedule);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateDay = (day: string, updates: Partial<DaySchedule>) => {
    setEditedSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
    setHasChanges(true);
  };

  const addBreak = (day: string) => {
    const currentBreaks = editedSchedule[day]?.breaks || [];
    updateDay(day, {
      breaks: [...currentBreaks, { start: "12:00", end: "13:00" }],
    });
  };

  const removeBreak = (day: string, index: number) => {
    const currentBreaks = editedSchedule[day]?.breaks || [];
    updateDay(day, {
      breaks: currentBreaks.filter((_, i) => i !== index),
    });
  };

  const updateBreak = (day: string, index: number, field: "start" | "end", value: string) => {
    const currentBreaks = editedSchedule[day]?.breaks || [];
    const updatedBreaks = [...currentBreaks];
    updatedBreaks[index] = { ...updatedBreaks[index], [field]: value };
    updateDay(day, { breaks: updatedBreaks });
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceSchedule = editedSchedule[sourceDay];
    const newSchedule = { ...editedSchedule };

    DAYS.forEach(({ key }) => {
      if (key !== sourceDay && key !== "sunday") {
        newSchedule[key] = { ...sourceSchedule };
      }
    });

    setEditedSchedule(newSchedule);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedSchedule);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateHours = (day: DaySchedule) => {
    if (!day.enabled) return 0;

    const [startHour, startMin] = day.start.split(":").map(Number);
    const [endHour, endMin] = day.end.split(":").map(Number);

    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    if (day.breaks) {
      day.breaks.forEach((brk) => {
        const [bStartHour, bStartMin] = brk.start.split(":").map(Number);
        const [bEndHour, bEndMin] = brk.end.split(":").map(Number);
        totalMinutes -= (bEndHour * 60 + bEndMin) - (bStartHour * 60 + bStartMin);
      });
    }

    return totalMinutes / 60;
  };

  const totalWeeklyHours = DAYS.reduce((sum, { key }) => {
    return sum + calculateHours(editedSchedule[key] || { enabled: false, start: "09:00", end: "17:00" });
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Work Schedule
              {staffName && <span className="text-muted-foreground font-normal">- {staffName}</span>}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {totalWeeklyHours.toFixed(1)} hours per week
            </p>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map(({ key, label }, index) => {
          const daySchedule = editedSchedule[key] || { enabled: false, start: "09:00", end: "17:00" };
          const hours = calculateHours(daySchedule);

          return (
            <div key={key}>
              {index > 0 && <Separator className="my-4" />}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={(enabled) => updateDay(key, { enabled })}
                    />
                    <Label className="font-medium">{label}</Label>
                    {daySchedule.enabled && (
                      <Badge variant="secondary" className="text-xs">
                        {hours.toFixed(1)}h
                      </Badge>
                    )}
                  </div>

                  {daySchedule.enabled && index === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToAllDays(key)}
                      className="text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy to weekdays
                    </Button>
                  )}
                </div>

                {daySchedule.enabled && (
                  <div className="ml-12 space-y-3">
                    {/* Working Hours */}
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={daySchedule.start}
                        onValueChange={(value) => updateDay(key, { start: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">to</span>
                      <Select
                        value={daySchedule.end}
                        onValueChange={(value) => updateDay(key, { end: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Breaks */}
                    <div className="space-y-2">
                      {daySchedule.breaks?.map((brk, breakIndex) => (
                        <div key={breakIndex} className="flex items-center gap-3 pl-8">
                          <Badge variant="outline" className="text-xs">Break</Badge>
                          <Select
                            value={brk.start}
                            onValueChange={(value) => updateBreak(key, breakIndex, "start", value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-muted-foreground">to</span>
                          <Select
                            value={brk.end}
                            onValueChange={(value) => updateBreak(key, breakIndex, "end", value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeBreak(key, breakIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-8 text-xs"
                        onClick={() => addBreak(key)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add break
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Overtime Warning */}
        {totalWeeklyHours > 40 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              Weekly hours exceed 40. Consider reviewing the schedule.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
