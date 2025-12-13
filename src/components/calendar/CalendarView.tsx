"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Appointment {
  id: string;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  status: string;
  client?: {
    firstName: string;
    lastName: string;
  } | null;
  staff?: {
    id: string;
    displayName?: string;
  };
  services: Array<{
    service: {
      name: string;
    };
  }>;
}

interface Staff {
  id: string;
  displayName?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface CalendarViewProps {
  appointments: Appointment[];
  staff: Staff[];
  selectedStaffId?: string;
  onSelectStaff: (staffId: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onAddAppointment: (date: Date, staffId?: string) => void;
  view?: "day" | "week";
}

export function CalendarView({
  appointments,
  staff,
  selectedStaffId,
  onSelectStaff,
  onSelectAppointment,
  onAddAppointment,
  view = "day",
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getWeekDays = () => {
    const days: Date[] = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledStart);
      if (view === "day") {
        return isSameDay(aptDate, currentDate);
      } else {
        const weekDays = getWeekDays();
        return weekDays.some((day) => isSameDay(aptDate, day));
      }
    }).filter((apt) => !selectedStaffId || apt.staff?.id === selectedStaffId);
  }, [appointments, currentDate, view, selectedStaffId]);

  const getAppointmentStyle = (apt: Appointment) => {
    const start = new Date(apt.scheduledStart);
    const end = new Date(apt.scheduledEnd);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const top = ((startHour - 8) / 12) * 100;
    const height = ((endHour - startHour) / 12) * 100;

    return {
      top: `${top}%`,
      height: `${height}%`,
    };
  };

  const statusColors: Record<string, string> = {
    BOOKED: "bg-blue-500",
    CONFIRMED: "bg-green-500",
    IN_SERVICE: "bg-purple-500",
    COMPLETED: "bg-gray-500",
    CANCELLED: "bg-red-500",
    NO_SHOW: "bg-yellow-500",
  };

  const renderDayColumn = (date: Date, staffMember?: Staff) => {
    const dayAppointments = filteredAppointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledStart);
      const matchesDay = isSameDay(aptDate, date);
      const matchesStaff = !staffMember || apt.staff?.id === staffMember.id;
      return matchesDay && matchesStaff;
    });

    return (
      <div className="relative flex-1 border-r last:border-r-0">
        {/* Hour grid lines */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute w-full border-t border-dashed border-gray-200"
            style={{ top: `${((hour - 8) / 12) * 100}%` }}
          />
        ))}

        {/* Appointments */}
        {dayAppointments.map((apt) => (
          <div
            key={apt.id}
            className={`absolute left-1 right-1 rounded-md px-2 py-1 text-white text-xs cursor-pointer overflow-hidden ${
              statusColors[apt.status] || "bg-blue-500"
            }`}
            style={getAppointmentStyle(apt)}
            onClick={() => onSelectAppointment(apt)}
          >
            <div className="font-medium truncate">
              {apt.client ? `${apt.client.firstName} ${apt.client.lastName}` : "Walk-in"}
            </div>
            <div className="truncate opacity-90">
              {apt.services.map((s) => s.service.name).join(", ")}
            </div>
          </div>
        ))}

        {/* Click to add */}
        <div
          className="absolute inset-0 cursor-pointer hover:bg-muted/20"
          onClick={() => onAddAppointment(date, staffMember?.id)}
        />
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <h2 className="text-lg font-semibold ml-4">{formatDate(currentDate)}</h2>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedStaffId || "all"} onValueChange={(v) => onSelectStaff(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.displayName || `${s.user?.firstName} ${s.user?.lastName}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => onAddAppointment(currentDate)}>
            <Plus className="h-4 w-4 mr-1" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r">
          <div className="h-10 border-b" /> {/* Header spacer */}
          <div className="relative h-[calc(100%-2.5rem)]">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-xs text-muted-foreground -translate-y-2"
                style={{ top: `${((hour - 8) / 12) * 100}%` }}
              >
                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div className="flex-1 flex overflow-x-auto">
          {view === "week" ? (
            getWeekDays().map((day) => (
              <div key={day.toISOString()} className="flex-1 min-w-[120px] flex flex-col">
                <div className={`h-10 border-b flex items-center justify-center text-sm font-medium ${
                  isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : ""
                }`}>
                  {day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                </div>
                <div className="flex-1 relative">
                  {renderDayColumn(day)}
                </div>
              </div>
            ))
          ) : selectedStaffId ? (
            <div className="flex-1 flex flex-col">
              <div className="h-10 border-b flex items-center justify-center text-sm font-medium">
                {staff.find((s) => s.id === selectedStaffId)?.displayName || "Staff"}
              </div>
              <div className="flex-1 relative">
                {renderDayColumn(currentDate)}
              </div>
            </div>
          ) : (
            staff.map((staffMember) => (
              <div key={staffMember.id} className="flex-1 min-w-[150px] flex flex-col">
                <div className="h-10 border-b flex items-center justify-center text-sm font-medium px-2 truncate">
                  {staffMember.displayName || `${staffMember.user?.firstName} ${staffMember.user?.lastName}`}
                </div>
                <div className="flex-1 relative">
                  {renderDayColumn(currentDate, staffMember)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-2 border-t text-xs">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span>{status.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
