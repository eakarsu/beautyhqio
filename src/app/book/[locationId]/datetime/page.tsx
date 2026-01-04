"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight, User } from "lucide-react";

interface TimeSlot {
  time: string;
  available: boolean;
  availableStaff: Array<{
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    color: string;
  }>;
}

export default function SelectDateTimePage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceIds = searchParams.get("services")?.split(",") || [];
  const rescheduleId = searchParams.get("reschedule") || "";

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    const serviceId = serviceIds[0]; // Use first service for availability

    fetch(
      `/api/booking/availability?locationId=${locationId}&date=${dateStr}&serviceId=${serviceId}`
    )
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locationId, selectedDate, serviceIds]);

  const handleContinue = () => {
    if (selectedTime && selectedStaff) {
      // Format date in local time (YYYY-MM-DD) to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      let url = `/book/${locationId}/confirm?services=${serviceIds.join(",")}&date=${dateStr}&time=${selectedTime}&staff=${selectedStaff}`;
      if (rescheduleId) {
        url += `&reschedule=${rescheduleId}`;
      }
      router.push(url);
    }
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    setSelectedTime(slot.time);
    if (slot.availableStaff.length === 1) {
      setSelectedStaff(slot.availableStaff[0].id);
    } else {
      setSelectedStaff(null);
    }
  };

  // Calendar helpers
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDateSelectable = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return date >= today;
  };

  const selectedSlot = slots.find((s) => s.time === selectedTime);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Date & Time
          </h1>
          <p className="text-gray-600">Choose your preferred appointment time</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1
                      )
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1
                      )
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-2 font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                {Array.from({ length: firstDayOfMonth }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const date = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day
                  );
                  const isSelected =
                    selectedDate.toDateString() === date.toDateString();
                  const selectable = isDateSelectable(day);

                  return (
                    <button
                      key={day}
                      onClick={() => selectable && setSelectedDate(date)}
                      disabled={!selectable}
                      className={`py-2 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-pink-600 text-white"
                          : selectable
                          ? "hover:bg-pink-100"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card>
            <CardHeader>
              <CardTitle>
                Available Times -{" "}
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSelect(slot)}
                      disabled={!slot.available}
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                        selectedTime === slot.time
                          ? "bg-pink-600 text-white"
                          : slot.available
                          ? "bg-gray-100 hover:bg-pink-100"
                          : "bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Staff Selection */}
        {selectedSlot && selectedSlot.availableStaff.length > 1 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Select Your Stylist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {selectedSlot.availableStaff.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedStaff === staff.id
                        ? "shadow-md"
                        : "border-gray-200 hover:shadow-sm"
                    }`}
                    style={{
                      borderColor: selectedStaff === staff.id ? staff.color : undefined,
                      backgroundColor: selectedStaff === staff.id ? `${staff.color}15` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${staff.color}20` }}
                      >
                        {staff.avatar ? (
                          <img
                            src={staff.avatar}
                            alt=""
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <User className="h-6 w-6" style={{ color: staff.color }} />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">
                          {staff.firstName} {staff.lastName}
                        </p>
                        <div
                          className="w-3 h-3 rounded-full mt-1"
                          style={{ backgroundColor: staff.color }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        {selectedTime && selectedStaff && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-gray-600">at {selectedTime}</p>
              </div>
              <Button
                onClick={handleContinue}
                className="bg-pink-600 hover:bg-pink-700"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
