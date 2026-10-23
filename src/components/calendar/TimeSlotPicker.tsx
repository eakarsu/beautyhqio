"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

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
  serviceIds?: string[];
  locationId?: string;
  onSelect: (time: string, staffId?: string) => void;
  selectedTime?: string;
}

interface ApiSlot {
  time: string;
  available: boolean;
  availableStaff?: Array<{ id: string; firstName: string; lastName: string }>;
}

export function TimeSlotPicker({
  date,
  duration,
  staffId,
  serviceId,
  serviceIds,
  locationId,
  onSelect,
  selectedTime,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"morning" | "afternoon" | "evening">("morning");

  const fetchAvailableSlots = useCallback(async () => {
    if (!locationId) {
      setSlots([]);
      setError("Choose a location to see real availability.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const ids = (serviceIds && serviceIds.length ? serviceIds : serviceId ? [serviceId] : []).join(",");
      const params = new URLSearchParams({
        locationId,
        date: format(date, "yyyy-MM-dd"),
      });
      if (ids) params.append("serviceIds", ids);
      if (staffId) params.append("staffId", staffId);

      const response = await fetch("/api/booking/availability?" + params);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || !Array.isArray(data.slots)) {
        throw new Error((data && data.error) || "Availability could not be loaded");
      }
      setSlots(
        (data.slots as ApiSlot[]).map((slot) => ({
          time: slot.time,
          available: slot.available,
          staffId: slot.availableStaff?.[0]?.id,
          staffName: slot.availableStaff?.[0]
            ? (slot.availableStaff[0].firstName + " " + slot.availableStaff[0].lastName).trim()
            : undefined,
        })),
      );
    } catch (cause) {
      // Never invent slots. A failed availability check must look failed,
      // not like a bookable calendar.
      setSlots([]);
      setError(cause instanceof Error ? cause.message : "Availability could not be loaded");
    } finally {
      setIsLoading(false);
    }
  }, [date, duration, staffId, serviceId, serviceIds, locationId]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

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
    return hour12 + ":" + minutes + " " + ampm;
  };

  const getAvailableCount = (period: "morning" | "afternoon" | "evening") => {
    return filterSlotsByPeriod(period).filter((s) => s.available).length;
  };

  const filteredSlots = filterSlotsByPeriod(selectedPeriod);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-2 mb-4">
          {[
            { id: "morning", label: "Morning", time: "9AM - 12PM" },
            { id: "afternoon", label: "Afternoon", time: "12PM - 5PM" },
            { id: "evening", label: "Evening", time: "5PM - 8PM" },
          ].map((period) => (
            <Button
              key={period.id}
              variant={selectedPeriod === period.id ? "default" : "outline"}
              className={"flex-1 flex flex-col h-auto py-3 " + (selectedPeriod === period.id ? "bg-rose-600 hover:bg-rose-700" : "")}
              onClick={() => setSelectedPeriod(period.id as "morning" | "afternoon" | "evening")}
            >
              <span className="font-medium">{period.label}</span>
              <span className="text-xs opacity-70">{period.time}</span>
              <Badge
                variant="secondary"
                className={"mt-1 " + (selectedPeriod === period.id ? "bg-white/20 text-white" : "")}
              >
                {getAvailableCount(period.id as "morning" | "afternoon" | "evening")} slots
              </Badge>
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            Loading available times...
          </div>
        ) : error ? (
          <div className="text-center py-8" role="alert">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" className="mt-3" onClick={fetchAvailableSlots}>
              Retry
            </Button>
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
                  className={"relative " + (!slot.available ? "opacity-50 cursor-not-allowed" : selectedTime === slot.time ? "bg-rose-600 hover:bg-rose-700" : "hover:border-rose-500")}
                  disabled={!slot.available}
                  onClick={() => slot.available && onSelect(slot.time, slot.staffId)}
                >
                  {selectedTime === slot.time && <CheckCircle className="h-4 w-4 mr-1" />}
                  {formatTime(slot.time)}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}

        {selectedTime && (
          <div className="mt-4 p-3 bg-rose-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-rose-600" />
              <span className="font-medium">Selected Time:</span>
              <span>{formatTime(selectedTime)}</span>
            </div>
            <Badge variant="secondary">{duration} min appointment</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
