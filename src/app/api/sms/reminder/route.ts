import { NextRequest, NextResponse } from "next/server";
import { sendAppointmentReminder } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// POST /api/sms/reminder - Send appointment reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, language = "en" } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId is required" },
        { status: 400 }
      );
    }

    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        services: { include: { service: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (!appointment.client?.phone) {
      return NextResponse.json(
        { error: "Client does not have a phone number" },
        { status: 400 }
      );
    }

    const date = new Date(appointment.scheduledStart).toLocaleDateString();
    const time = new Date(appointment.scheduledStart).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const serviceName = appointment.services[0]?.service?.name || "Appointment";

    const result = await sendAppointmentReminder(
      appointment.client.phone,
      appointment.client.firstName,
      date,
      time,
      serviceName,
      language
    );

    // Update appointment to mark reminder sent
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSent: true },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { error: "Failed to send reminder" },
      { status: 500 }
    );
  }
}

// GET /api/sms/reminder - Send reminders for upcoming appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursAhead = parseInt(searchParams.get("hours") || "24");
    const language = searchParams.get("language") || "en";

    const now = new Date();
    const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // Get appointments that need reminders
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledStart: {
          gte: now,
          lte: future,
        },
        reminderSent: false,
        status: {
          in: ["CONFIRMED", "BOOKED"],
        },
      },
      include: {
        client: true,
        services: { include: { service: true } },
      },
    });

    const results = [];

    for (const appointment of appointments) {
      if (!appointment.client?.phone) continue;

      const date = new Date(appointment.scheduledStart).toLocaleDateString();
      const time = new Date(appointment.scheduledStart).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const apptServiceName = appointment.services[0]?.service?.name || "Appointment";

      const result = await sendAppointmentReminder(
        appointment.client.phone,
        appointment.client.firstName,
        date,
        time,
        apptServiceName,
        appointment.client.preferredLanguage || language
      );

      if (result.success) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSent: true },
        });
      }

      results.push({
        appointmentId: appointment.id,
        clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
        ...result,
      });
    }

    return NextResponse.json({
      total: appointments.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
