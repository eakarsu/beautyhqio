import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentReminder, sendAppointmentReminderCall } from "@/lib/twilio";
import { sendAppointmentReminderEmail } from "@/lib/email";

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Allow if not configured (development)

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "");
  return token === cronSecret;
}

// Format date for display
function formatDate(date: Date, language: string = "en"): string {
  const locales: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    vi: "vi-VN",
    ko: "ko-KR",
    zh: "zh-CN",
  };

  return date.toLocaleDateString(locales[language] || "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Format time for display
function formatTime(date: Date, language: string = "en"): string {
  const locales: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    vi: "vi-VN",
    ko: "ko-KR",
    zh: "zh-CN",
  };

  return date.toLocaleTimeString(locales[language] || "en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get("hours") || "24", 10);

    // Calculate time window (23-25 hours from now for 24-hour reminders)
    const now = new Date();
    const windowStart = new Date(now.getTime() + (hours - 1) * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + (hours + 1) * 60 * 60 * 1000);

    // Find appointments that need reminders
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledStart: {
          gte: windowStart,
          lte: windowEnd,
        },
        status: {
          in: ["BOOKED", "CONFIRMED"],
        },
        OR: [
          { reminderSent: false },
          { emailReminderSent: false },
          { callReminderSent: false },
        ],
      },
      include: {
        client: true,
        services: {
          include: {
            service: true,
          },
        },
        location: {
          include: {
            business: true,
          },
        },
      },
    });

    console.log(`[Cron] Found ${appointments.length} appointments needing reminders`);

    const results = {
      total: appointments.length,
      sms: { sent: 0, failed: 0 },
      email: { sent: 0, failed: 0 },
      call: { sent: 0, failed: 0 },
      details: [] as Array<{
        appointmentId: string;
        clientName: string;
        sms: boolean;
        email: boolean;
        call: boolean;
      }>,
    };

    for (const appointment of appointments) {
      const client = appointment.client;
      if (!client) continue;

      const serviceName =
        appointment.services[0]?.service?.name || "Appointment";
      const clientName = `${client.firstName} ${client.lastName}`;
      const language = client.preferredLanguage || "en";
      const businessName = appointment.location?.business?.name || "Beauty & Wellness";

      const date = formatDate(appointment.scheduledStart, language);
      const time = formatTime(appointment.scheduledStart, language);

      const result = {
        appointmentId: appointment.id,
        clientName,
        sms: false,
        email: false,
        call: false,
      };

      // Determine contact method based on client preference
      const preferredMethod = client.preferredContactMethod || "SMS";

      // Send SMS reminder (only if preferred method is SMS)
      if (
        !appointment.reminderSent &&
        client.phone &&
        client.allowSms !== false &&
        preferredMethod === "SMS"
      ) {
        try {
          const smsResult = await sendAppointmentReminder(
            client.phone,
            clientName,
            date,
            time,
            serviceName,
            language
          );

          if (smsResult.success) {
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: {
                reminderSent: true,
                reminderSentAt: new Date(),
              },
            });
            results.sms.sent++;
            result.sms = true;
          } else {
            results.sms.failed++;
          }
        } catch (error) {
          console.error(`[Cron] SMS failed for ${appointment.id}:`, error);
          results.sms.failed++;
        }
      }

      // Send Email reminder (always send if email exists and allowed)
      if (
        !appointment.emailReminderSent &&
        client.email &&
        client.allowEmail !== false
      ) {
        try {
          const emailResult = await sendAppointmentReminderEmail(
            client.email,
            clientName,
            date,
            time,
            serviceName,
            businessName,
            language
          );

          if (emailResult.success) {
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: {
                emailReminderSent: true,
                emailReminderSentAt: new Date(),
              },
            });
            results.email.sent++;
            result.email = true;
          } else {
            results.email.failed++;
          }
        } catch (error) {
          console.error(`[Cron] Email failed for ${appointment.id}:`, error);
          results.email.failed++;
        }
      }

      // Send Voice Call reminder (if preferred method is NOT SMS)
      const shouldCall = preferredMethod !== "SMS";

      if (
        !appointment.callReminderSent &&
        client.phone &&
        shouldCall
      ) {
        try {
          const callResult = await sendAppointmentReminderCall(
            client.phone,
            clientName,
            date,
            time,
            serviceName,
            language
          );

          if (callResult.success) {
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: {
                callReminderSent: true,
                callReminderSentAt: new Date(),
              },
            });
            results.call.sent++;
            result.call = true;
          } else {
            results.call.failed++;
          }
        } catch (error) {
          console.error(`[Cron] Call failed for ${appointment.id}:`, error);
          results.call.failed++;
        }
      }

      results.details.push(result);
    }

    console.log(
      `[Cron] Reminders sent - SMS: ${results.sms.sent}, Email: ${results.email.sent}, Calls: ${results.call.sent}`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    console.error("[Cron] Error processing reminders:", error);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}

// POST endpoint for manual trigger (useful for testing)
export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delegate to GET handler
  return GET(request);
}
