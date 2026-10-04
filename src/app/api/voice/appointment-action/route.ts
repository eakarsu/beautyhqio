import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { context, endpoint } from "@/lib/operations/core";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// POST /api/voice/appointment-action - Handle confirm/reschedule/cancel actions.
//
// Twilio-signed callers are accepted via the request signature; other callers
// must present an authenticated staff session. Retired in production unless
// ENABLE_LEGACY_APPOINTMENT_WRITES is set (see src/middleware.ts).
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const formData = await request.formData();

    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      return NextResponse.json({ error: "Twilio integration is not configured" }, { status: 503 });
    }
    const signature = request.headers.get("x-twilio-signature") || "";
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") params[key] = value;
    });
    // Sign the public URL Twilio was configured with, falling back to the request URL.
    const signingUrl = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(request.nextUrl.pathname + request.nextUrl.search, process.env.NEXT_PUBLIC_APP_URL).toString()
      : request.url;
    if (!signature || !twilio.validateRequest(authToken, signature, signingUrl, params)) {
      await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    }

    const digits = formData.get("Digits") as string;
    const from = formData.get("From") as string;

    // Find the caller's client and scope the appointment lookup to that tenant.
    const client = await prisma.client.findFirst({
      where: {
        phone: {
          contains: from.replace(/\D/g, "").slice(-10),
        },
      },
      select: { id: true, businessId: true },
    });

    const appointment = client
      ? await prisma.appointment.findFirst({
          where: {
            clientId: client.id,
            businessId: client.businessId,
            scheduledStart: {
              gte: new Date(),
            },
            status: {
              in: ["CONFIRMED", "BOOKED"],
            },
          },
          include: {
            depositIntent: { select: { status: true } },
            services: { include: { service: true } },
          },
          orderBy: {
            scheduledStart: "asc",
          },
        })
      : null;

    if (!appointment) {
      const twiml = generateTwiML({
        say: {
          text: "I couldn't find your appointment. Would you like to book a new one?",
        },
        gather: {
          action: "/api/voice/menu",
          numDigits: 1,
          timeout: 10,
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    let twiml: string;

    switch (digits) {
      case "1":
        if (appointment.depositIntent?.status === "PENDING") {
          twiml = generateTwiML({ say: { text: "A deposit is due before this appointment can be confirmed. Please contact the salon to arrange payment." }, redirect: "/api/voice/transfer" });
          break;
        }
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: "CONFIRMED" },
        });

        twiml = generateTwiML({
          say: {
            text: "Your appointment has been confirmed. We look forward to seeing you! Is there anything else I can help you with? Press 1 to book another appointment, or press 3 to speak with someone.",
          },
          gather: {
            action: "/api/voice/menu",
            numDigits: 1,
            timeout: 5,
          },
        });

        twiml = twiml.replace(
          "</Response>",
          "<Say voice=\"Polly.Joanna\">Thank you for calling. Goodbye!</Say><Hangup/></Response>"
        );
        break;

      case "2": {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        dayAfter.setHours(9, 0, 0, 0);

        twiml = generateTwiML({
          say: {
            text: `I can reschedule your ${appointment.services[0]?.service?.name || "appointment"}. Press 1 for tomorrow at 9 AM, or press 2 for the day after tomorrow at 9 AM.`,
          },
          gather: {
            action: `/api/voice/reschedule?appointmentId=${appointment.id}&option1=${tomorrow.toISOString()}&option2=${dayAfter.toISOString()}`,
            numDigits: 1,
            timeout: 10,
          },
        });
        break;
      }

      case "3": {
        await prisma.$transaction(async (tx) => {
          await tx.appointment.update({ where: { id: appointment.id }, data: { status: "CANCELLED", version: { increment: 1 } } });
          await tx.appointmentDepositIntent.updateMany({ where: { appointmentId: appointment.id, status: "PENDING" }, data: { status: "CANCELLED", version: { increment: 1 } } });
        });

        const cancelledServiceName = appointment.services[0]?.service?.name || "appointment";
        await prisma.activity.create({
          data: {
            clientId: client!.id,
            type: "APPOINTMENT_CANCELLED",
            title: "Appointment cancelled via phone",
            description: `${cancelledServiceName} appointment cancelled`,
            metadata: {
              appointmentId: appointment.id,
              businessId: client!.businessId,
            },
          },
        });

        twiml = generateTwiML({
          say: {
            text: "Your appointment has been cancelled. Would you like to book a new appointment? Press 1 for yes, or press any other key to end the call.",
          },
          gather: {
            action: "/api/voice/menu",
            numDigits: 1,
            timeout: 5,
          },
        });

        twiml = twiml.replace(
          "</Response>",
          "<Say voice=\"Polly.Joanna\">Thank you for calling. Goodbye!</Say><Hangup/></Response>"
        );
        break;
      }

      default:
        twiml = generateTwiML({
          say: {
            text: "I didn't understand that. Press 1 to confirm, 2 to reschedule, or 3 to cancel your appointment.",
          },
          gather: {
            action: "/api/voice/appointment-action",
            numDigits: 1,
            timeout: 10,
          },
        });
    }

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  });
}
