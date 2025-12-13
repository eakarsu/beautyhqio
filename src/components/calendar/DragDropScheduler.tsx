"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  GripVertical,
} from "lucide-react";
import { format, addDays, subDays, startOfWeek, addHours, isSameDay } from "date-fns";

interface Appointment {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  client: {
    firstName: string;
    lastName: string;
  };
  staff: {
    id: string;
    displayName?: string;
    user: { firstName: string; lastName: string };
  };
  services: Array<{ service: { name: string; color?: string } }>;
}

interface StaffMember {
  id: string;
  displayName?: string;
  user: { firstName: string; lastName: string };
  color?: string;
}

interface DragDropSchedulerProps {
  initialDate?: Date;
  onAppointmentMove?: (appointmentId: string, newStart: string, newStaffId?: string) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
}

export function DragDropScheduler({
  initialDate = new Date(),
  onAppointmentMove,
  onAppointmentClick,
}: DragDropSchedulerProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ time: string; staffId: string } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 9); // 9 AM to 8 PM

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const [appointmentsRes, staffRes] = await Promise.all([
        fetch(`/api/appointments?date=${dateStr}`),
        fetch("/api/staff"),
      ]);

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        setAppointments(data);
      }
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Demo data
      setStaff([
        { id: "s1", displayName: "Sarah J.", user: { firstName: "Sarah", lastName: "Johnson" }, color: "#E91E63" },
        { id: "s2", displayName: "Mike B.", user: { firstName: "Mike", lastName: "Brown" }, color: "#2196F3" },
        { id: "s3", displayName: "Lisa W.", user: { firstName: "Lisa", lastName: "Williams" }, color: "#4CAF50" },
      ]);
      setAppointments([
        {
          id: "a1",
          scheduledStart: new Date(currentDate.setHours(10, 0)).toISOString(),
          scheduledEnd: new Date(currentDate.setHours(11, 0)).toISOString(),
          status: "CONFIRMED",
          client: { firstName: "Jane", lastName: "Doe" },
          staff: { id: "s1", displayName: "Sarah J.", user: { firstName: "Sarah", lastName: "Johnson" } },
          services: [{ service: { name: "Haircut", color: "#E91E63" } }],
        },
        {
          id: "a2",
          scheduledStart: new Date(currentDate.setHours(14, 0)).toISOString(),
          scheduledEnd: new Date(currentDate.setHours(15, 30)).toISOString(),
          status: "CONFIRMED",
          client: { firstName: "John", lastName: "Smith" },
          staff: { id: "s2", displayName: "Mike B.", user: { firstName: "Mike", lastName: "Brown" } },
          services: [{ service: { name: "Color Treatment", color: "#2196F3" } }],
        },
        {
          id: "a3",
          scheduledStart: new Date(currentDate.setHours(11, 30)).toISOString(),
          scheduledEnd: new Date(currentDate.setHours(12, 30)).toISOString(),
          status: "CHECKED_IN",
          client: { firstName: "Emily", lastName: "Chen" },
          staff: { id: "s3", displayName: "Lisa W.", user: { firstName: "Lisa", lastName: "Williams" } },
          services: [{ service: { name: "Styling", color: "#4CAF50" } }],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStaffName = (staffMember: StaffMember) => {
    return staffMember.displayName || `${staffMember.user.firstName} ${staffMember.user.lastName}`;
  };

  const getAppointmentStyle = (appointment: Appointment) => {
    const start = new Date(appointment.scheduledStart);
    const end = new Date(appointment.scheduledEnd);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const top = (startHour - 9) * 60; // 60px per hour
    const height = (endHour - startHour) * 60;

    return { top: `${top}px`, height: `${height}px` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-100 border-blue-400";
      case "CHECKED_IN":
        return "bg-green-100 border-green-400";
      case "IN_PROGRESS":
        return "bg-purple-100 border-purple-400";
      case "COMPLETED":
        return "bg-gray-100 border-gray-400";
      case "CANCELLED":
        return "bg-red-100 border-red-400";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, time: number, staffId: string) => {
    e.preventDefault();
    setDragOverSlot({ time: `${time}:00`, staffId });
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, time: number, staffId: string) => {
    e.preventDefault();
    if (draggedAppointment) {
      const newStart = new Date(currentDate);
      newStart.setHours(time, 0, 0, 0);
      onAppointmentMove?.(draggedAppointment.id, newStart.toISOString(), staffId);

      // Optimistically update local state
      setAppointments((prev) =>
        prev.map((apt) => {
          if (apt.id === draggedAppointment.id) {
            const duration =
              new Date(apt.scheduledEnd).getTime() - new Date(apt.scheduledStart).getTime();
            return {
              ...apt,
              scheduledStart: newStart.toISOString(),
              scheduledEnd: new Date(newStart.getTime() + duration).toISOString(),
              staff: staff.find((s) => s.id === staffId) || apt.staff,
            };
          }
          return apt;
        })
      );
    }
    handleDragEnd();
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {format(currentDate, "EEEE, MMM d")}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading schedule...
          </div>
        ) : (
          <div className="overflow-auto">
            <div className="min-w-[800px]">
              {/* Header - Staff Names */}
              <div className="flex border-b sticky top-0 bg-white z-10">
                <div className="w-20 flex-shrink-0 border-r p-2 bg-muted/30">
                  <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
                </div>
                {staff.map((s) => (
                  <div
                    key={s.id}
                    className="flex-1 border-r p-3 text-center bg-muted/30"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: s.color || "#9CA3AF" }}
                      />
                      <span className="font-medium">{getStaffName(s)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="relative" ref={gridRef}>
                {hours.map((hour) => (
                  <div key={hour} className="flex border-b" style={{ height: "60px" }}>
                    <div className="w-20 flex-shrink-0 border-r p-2 text-sm text-muted-foreground">
                      {format(new Date().setHours(hour, 0), "h a")}
                    </div>
                    {staff.map((s) => (
                      <div
                        key={`${hour}-${s.id}`}
                        className={`flex-1 border-r relative ${
                          dragOverSlot?.time === `${hour}:00` && dragOverSlot?.staffId === s.id
                            ? "bg-rose-50"
                            : ""
                        }`}
                        onDragOver={(e) => handleDragOver(e, hour, s.id)}
                        onDrop={(e) => handleDrop(e, hour, s.id)}
                      >
                        {/* Half-hour line */}
                        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-100" />
                      </div>
                    ))}
                  </div>
                ))}

                {/* Appointments */}
                {appointments.map((apt) => {
                  const staffIndex = staff.findIndex((s) => s.id === apt.staff.id);
                  if (staffIndex === -1) return null;

                  const style = getAppointmentStyle(apt);
                  const leftOffset = 80 + staffIndex * ((gridRef.current?.clientWidth || 800) - 80) / staff.length;
                  const width = ((gridRef.current?.clientWidth || 800) - 80) / staff.length - 8;

                  return (
                    <div
                      key={apt.id}
                      className={`absolute rounded-lg border-l-4 p-2 cursor-move shadow-sm ${getStatusColor(
                        apt.status
                      )} ${draggedAppointment?.id === apt.id ? "opacity-50" : ""}`}
                      style={{
                        ...style,
                        left: `${leftOffset + 4}px`,
                        width: `${width}px`,
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, apt)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onAppointmentClick?.(apt)}
                    >
                      <div className="flex items-start gap-1">
                        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm truncate">
                            {apt.client.firstName} {apt.client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {apt.services.map((s) => s.service.name).join(", ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.scheduledStart), "h:mm a")} -{" "}
                            {format(new Date(apt.scheduledEnd), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
