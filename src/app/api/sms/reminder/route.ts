import { NextRequest } from "next/server";
import { z } from "zod";
import { context, endpoint, fail } from "@/lib/operations/core";
import { sendAppointmentReminder } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

const ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;
const bodySchema = z.object({
  appointmentId: z.string().trim().min(1).max(191),
  language: z.string().trim().min(2).max(10).default("en"),
});

// POST /api/sms/reminder - Send a reminder for an appointment in this business.
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { appointmentId, language } = bodySchema.parse(await request.json());

    // Tenant-scoped: we never send on behalf of another business.
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId: ctx.businessId },
      include: {
        client: true,
        services: { include: { service: true } },
      },
    });

    if (!appointment) return fail(404, "Appointment not found");

    if (!appointment.client?.phone) {
      return fail(400, "Client does not have a phone number");
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

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { reminderSent: true },
    });

    return result;
  });
}

// GET /api/sms/reminder - Send reminders for upcoming appointments in this business.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context([...ROLES]);
    const { searchParams } = new URL(request.url);
    const hoursAhead = z.coerce.number().int().min(1).max(168).catch(24).parse(searchParams.get("hours") || 24);
    const language = z.string().trim().min(2).max(10).catch("en").parse(searchParams.get("language") || "en");

    const now = new Date();
    const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: ctx.businessId,
        scheduledStart: { gte: now, lte: future },
        reminderSent: false,
        status: { in: ["CONFIRMED", "BOOKED"] },
      },
      include: {
        client: true,
        services: { include: { service: true } },
      },
      take: 200,
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

    return {
      total: appointments.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  });
}
