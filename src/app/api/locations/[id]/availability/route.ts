import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/locations/[id]/availability - Get available time slots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");

    if (!staffId || !serviceId || !date) {
      return NextResponse.json(
        { error: "staffId, serviceId, and date are required" },
        { status: 400 }
      );
    }

    // Get the service to know the duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const serviceDuration = service.duration;

    // Parse the date
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get staff schedule for this day
    const staffSchedule = await prisma.staffSchedule.findFirst({
      where: {
        staffId: staffId,
        dayOfWeek: dayOfWeek,
        isWorking: true,
      },
    });

    // Default business hours if no schedule found
    const startHour = staffSchedule?.startTime
      ? parseInt(staffSchedule.startTime.split(":")[0])
      : 9;
    const endHour = staffSchedule?.endTime
      ? parseInt(staffSchedule.endTime.split(":")[0])
      : 17;

    // Get existing appointments for this staff on this date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        staffId: staffId,
        scheduledStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ["CANCELLED"],
        },
      },
      select: {
        scheduledStart: true,
        scheduledEnd: true,
      },
    });

    // Generate time slots (every 30 minutes)
    const slots: { time: string; available: boolean }[] = [];
    const now = new Date();

    for (let hour = startHour; hour < endHour; hour++) {
      for (const minute of [0, 30]) {
        const slotTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

        // Create Date object for this slot
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hour, minute, 0, 0);

        // Check if slot is in the past
        if (slotDate <= now) {
          slots.push({ time: slotTime, available: false });
          continue;
        }

        // Check if slot end time would exceed business hours
        const slotEndTime = new Date(slotDate.getTime() + serviceDuration * 60000);
        if (slotEndTime.getHours() > endHour ||
            (slotEndTime.getHours() === endHour && slotEndTime.getMinutes() > 0)) {
          slots.push({ time: slotTime, available: false });
          continue;
        }

        // Check for conflicts with existing appointments
        const hasConflict = existingAppointments.some((apt) => {
          const aptStart = new Date(apt.scheduledStart);
          const aptEnd = new Date(apt.scheduledEnd);
          // Check if this slot overlaps with existing appointment
          return (
            (slotDate >= aptStart && slotDate < aptEnd) ||
            (slotEndTime > aptStart && slotEndTime <= aptEnd) ||
            (slotDate <= aptStart && slotEndTime >= aptEnd)
          );
        });

        slots.push({ time: slotTime, available: !hasConflict });
      }
    }

    return NextResponse.json({
      date: date,
      slots: slots,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
