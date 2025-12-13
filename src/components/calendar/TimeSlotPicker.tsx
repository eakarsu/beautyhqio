"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, CheckCircle } from "lucide-react";
import { format, addMinutes, isBefore, isAfter, parseISO, startOfDay } from "date-fns";

interface TimeSlot {
  time: string;
  available: boolean;
  staffId?: string;
  staffName?: string;
}

interface TimeSlotPickerProps {
  date: Date;
  duration: number; // in minutes
  staffId?: string;
  serviceId?: string;
  onSelect: (time: string, staffId?: string) => void;
  selectedTime?: string;
}

export function TimeSlotPicker({
  date,
  duration,
  staffId,
  serviceId,
  onSelect,
  selectedTime,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"morning" | "afternoon" | "evening">("morning");

  useEffect(() => {
    fetchAvailableSlots();
  }, [date, duration, staffId, serviceId]);

  const fetchAvailableSlots = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        date: format(date, "yyyy-MM-dd"),
        duration: duration.toString(),
      });
      if (staffId) params.append("staffId", staffId);
      if (serviceId) params.append("serviceId", serviceId);

      const response = await fetch(`/api/availability?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      // Generate demo slots
      generateDemoSlots();
    } finally {
      setIsLoading(false);
    }
  };

  const generateDemoSlots = () => {
    const demoSlots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 20; // 8 PM
    const interval = 30; // 30 minute intervals

    const today = startOfDay(date);
    const now = new Date();

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const slotTime = new Date(today);
        slotTime.setHours(hour, minute, 0, 0);

        // Skip past slots for today
        if (format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd") && isBefore(slotTime, now)) {
          continue;
        }

        // Randomly make some slots unavailable
        const available = Math.random() > 0.3;

        demoSlots.push({
          time: format(slotTime, "HH:mm"),
          available,
          staffId: available ? "staff1" : undefined,
          staffName: available ? "Available" : undefined,
        });
      }
    }

    setSlots(demoSlots);
  };

  const filterSlotsByPeriod = (period: "morning" | "afternoon" | "evening") => {
    return slots.filter((slot) => {
      const hour = parseInt(slot.time.split(":")[0]);
      switch (period) {
        case "morning":
          return hour >= 9 && hour < 12;
        case "afternoon":
          return hour >= 12 && hour < 17;
        case "evening":
          return hour >= 17 && hour < 21;
        default:
          return true;
      }
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getAvailableCount = (period: "morning" | "afternoon" | "evening") => {
    return filterSlotsByPeriod(period).filter((s) => s.available).length;
  };

  const filteredSlots = filterSlotsByPeriod(selectedPeriod);

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Period Selection */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "morning", label: "Morning", time: "9AM - 12PM" },
            { id: "afternoon", label: "Afternoon", time: "12PM - 5PM" },
            { id: "evening", label: "Evening", time: "5PM - 8PM" },
          ].map((period) => (
            <Button
              key={period.id}
              variant={selectedPeriod === period.id ? "default" : "outline"}
              className={`flex-1 flex flex-col h-auto py-3 ${
                selectedPeriod === period.id ? "bg-rose-600 hover:bg-rose-700" : ""
              }`}
              onClick={() => setSelectedPeriod(period.id as "morning" | "afternoon" | "evening")}
            >
              <span className="font-medium">{period.label}</span>
              <span className="text-xs opacity-70">{period.time}</span>
              <Badge
                variant="secondary"
                className={`mt-1 ${
                  selectedPeriod === period.id ? "bg-white/20 text-white" : ""
                }`}
              >
                {getAvailableCount(period.id as "morning" | "afternoon" | "evening")} slots
              </Badge>
            </Button>
          ))}
        </div>

        {/* Time Slots */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            Loading available times...
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No available times in this period
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-3 gap-2">
              {filteredSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? "default" : "outline"}
                  className={`relative ${
                    !slot.available
                      ? "opacity-50 cursor-not-allowed"
                      : selectedTime === slot.time
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "hover:border-rose-500"
                  }`}
                  disabled={!slot.available}
                  onClick={() => slot.available && onSelect(slot.time, slot.staffId)}
                >
                  {selectedTime === slot.time && (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  {formatTime(slot.time)}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Selected Time Display */}
        {selectedTime && (
          <div className="mt-4 p-3 bg-rose-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-rose-600" />
              <span className="font-medium">Selected Time:</span>
              <span>{formatTime(selectedTime)}</span>
            </div>
            <Badge variant="secondary">
              {duration} min appointment
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
