import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { context, endpoint } from "@/lib/operations/core";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// POST /api/voice/reschedule - Handle Twilio appointment rescheduling.
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

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");
    const option1 = searchParams.get("option1");
    const option2 = searchParams.get("option2");

    if (!appointmentId) {
      const twiml = generateTwiML({
        say: {
          text: "I'm sorry, I couldn't find your appointment. Let me transfer you to someone who can help.",
        },
        redirect: "/api/voice/transfer",
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // The appointment id arrives in the query string, so it is never trusted on
    // its own: the caller's client record must own the appointment.
    const client = from
      ? await prisma.client.findFirst({
          where: { phone: { contains: from.replace(/\D/g, "").slice(-10) } },
          select: { id: true, businessId: true },
        })
      : null;

    const appointment = client
      ? await prisma.appointment.findFirst({
          where: {
            id: appointmentId,
            clientId: client.id,
            businessId: client.businessId,
          },
          include: {
            services: { include: { service: true } },
            client: true,
          },
        })
      : null;

    if (!appointment) {
      const twiml = generateTwiML({
        say: {
          text: "I couldn't find your appointment. Please try again.",
        },
        redirect: "/api/voice/menu",
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const appointmentService = appointment.services[0]?.service;
    const serviceName = appointmentService?.name || "appointment";
    const serviceDuration = appointmentService?.duration || 60;

    let newTime: Date;

    if (digits === "1" && option1) {
      newTime = new Date(option1);
    } else if (digits === "2" && option2) {
      newTime = new Date(option2);
    } else {
      const twiml = generateTwiML({
        say: {
          text: "I didn't understand that. Press 1 for the first option, or press 2 for the second option.",
        },
        gather: {
          action: `/api/voice/reschedule?appointmentId=${appointmentId}&option1=${option1}&option2=${option2}`,
          numDigits: 1,
          timeout: 10,
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (Number.isNaN(newTime.getTime())) {
      const twiml = generateTwiML({
        say: {
          text: "I'm sorry, that time is not available. Let me connect you with someone who can help.",
        },
        redirect: "/api/voice/transfer",
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const newEndTime = new Date(newTime.getTime() + serviceDuration * 60000);

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        scheduledStart: newTime,
        scheduledEnd: newEndTime,
        status: "CONFIRMED",
      },
    });

    const dateStr = newTime.toLocaleDateString();
    const timeStr = newTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (appointment.clientId) {
      await prisma.activity.create({
        data: {
          clientId: appointment.clientId,
          type: "APPOINTMENT_BOOKED",
          title: "Appointment rescheduled via phone",
          description: `${serviceName} rescheduled to ${dateStr} at ${timeStr}`,
          metadata: {
            appointmentId,
            businessId: appointment.businessId,
            oldTime: appointment.scheduledStart.toISOString(),
            newTime: newTime.toISOString(),
          },
        },
      });
    }

    const twiml = generateTwiML({
      say: {
        text: `Your ${serviceName} has been rescheduled to ${dateStr} at ${timeStr}. You'll receive a confirmation text shortly. Is there anything else I can help you with?`,
      },
      gather: {
        action: "/api/voice/menu",
        numDigits: 1,
        timeout: 5,
      },
    });

    const finalTwiml = twiml.replace(
      "</Response>",
      "<Say voice=\"Polly.Joanna\">Thank you for calling. Goodbye!</Say><Hangup/></Response>"
    );

    return new NextResponse(finalTwiml, {
      headers: { "Content-Type": "text/xml" },
    });
  });
}
