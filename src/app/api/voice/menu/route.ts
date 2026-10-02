import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { endpoint } from "@/lib/operations/core";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// Provider-initiated (Twilio IVR step). Authenticated with the Twilio request
// signature; fail closed when the shared secret is not configured.
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
      return NextResponse.json({ error: "Invalid Twilio signature" }, { status: 403 });
    }

    const digits = formData.get("Digits") as string;
    const speechResult = formData.get("SpeechResult") as string;
    const from = formData.get("From") as string;

    let twiml: string;
    const input = digits || speechResult?.toLowerCase();

    if (input === "1" || input?.includes("book") || input?.includes("appointment")) {
      twiml = generateTwiML({
        say: {
          text: "Let me help you book an appointment. Please say the service you'd like to book, or press 1 for haircut, 2 for color, 3 for manicure.",
        },
        gather: {
          action: "/api/voice/book",
          timeout: 10,
          input: ["dtmf", "speech"],
        },
      });
    } else if (input === "2" || input?.includes("check") || input?.includes("status")) {
      const client = await prisma.client.findFirst({
        where: {
          phone: {
            contains: from.replace(/\D/g, "").slice(-10),
          },
        },
        select: { id: true, businessId: true },
      });

      const apt = client
        ? await prisma.appointment.findFirst({
            where: {
              clientId: client.id,
              businessId: client.businessId,
              scheduledStart: { gte: new Date() },
              status: { in: ["CONFIRMED", "BOOKED"] },
            },
            include: {
              services: { include: { service: true } },
            },
            orderBy: {
              scheduledStart: "asc",
            },
          })
        : null;

      if (apt) {
        const date = new Date(apt.scheduledStart).toLocaleDateString();
        const time = new Date(apt.scheduledStart).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const serviceName = apt.services[0]?.service?.name || "appointment";

        twiml = generateTwiML({
          say: {
            text: `You have a ${serviceName} appointment scheduled for ${date} at ${time}. Press 1 to confirm, 2 to reschedule, or 3 to cancel.`,
          },
          gather: {
            action: "/api/voice/appointment-action",
            numDigits: 1,
            timeout: 10,
          },
        });
      } else {
        twiml = generateTwiML({
          say: {
            text: "I don't see any upcoming appointments for this phone number. Would you like to book one? Press 1 to book, or 3 to speak with someone.",
          },
          gather: {
            action: "/api/voice/menu",
            numDigits: 1,
            timeout: 10,
          },
        });
      }
    } else if (input === "3" || input?.includes("speak") || input?.includes("human") || input?.includes("person")) {
      twiml = generateTwiML({
        say: {
          text: "Please hold while I connect you to a staff member.",
        },
        redirect: "/api/voice/transfer",
      });
    } else {
      twiml = generateTwiML({
        say: {
          text: "I didn't understand that. Press 1 to book an appointment, 2 to check your appointment, or 3 to speak with someone.",
        },
        gather: {
          action: "/api/voice/menu",
          numDigits: 1,
          timeout: 10,
        },
      });
    }

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  });
}
