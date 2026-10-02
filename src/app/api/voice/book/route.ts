import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { context, endpoint } from "@/lib/operations/core";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// POST /api/voice/book - Handle the Twilio booking flow.
//
// Primarily provider-initiated, so it is authenticated with the Twilio request
// signature. A non-Twilio caller must instead present an authenticated staff
// session (context()); the legacy direct path is retired in production unless
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
    const speechResult = formData.get("SpeechResult") as string;
    const from = formData.get("From") as string;

    const input = digits || speechResult?.toLowerCase();

    // Map input to service
    let serviceName = "";
    if (input === "1" || input?.includes("haircut") || input?.includes("cut")) {
      serviceName = "Haircut";
    } else if (input === "2" || input?.includes("color") || input?.includes("dye")) {
      serviceName = "Hair Color";
    } else if (input === "3" || input?.includes("manicure") || input?.includes("nails")) {
      serviceName = "Manicure";
    } else if (input?.includes("pedicure")) {
      serviceName = "Pedicure";
    } else if (input?.includes("facial")) {
      serviceName = "Facial";
    } else if (input?.includes("massage")) {
      serviceName = "Massage";
    }

    if (!serviceName) {
      const twiml = generateTwiML({
        say: {
          text: "I didn't catch that. Please press 1 for haircut, 2 for color, or 3 for manicure.",
        },
        gather: {
          action: "/api/voice/book",
          numDigits: 1,
          timeout: 10,
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Resolve the caller's business from their client record where possible, so
    // a service from another tenant can never be selected.
    const client = from
      ? await prisma.client.findFirst({
          where: { phone: { contains: from.replace(/\D/g, "").slice(-10) } },
          select: { id: true, businessId: true },
        })
      : null;

    const service = await prisma.service.findFirst({
      where: {
        name: {
          contains: serviceName,
          mode: "insensitive",
        },
        isActive: true,
        ...(client ? { businessId: client.businessId } : {}),
      },
    });

    if (!service) {
      const twiml = generateTwiML({
        say: {
          text: `I'm sorry, ${serviceName} is not currently available. Would you like to book a different service?`,
        },
        gather: {
          action: "/api/voice/book",
          timeout: 10,
          input: ["dtmf", "speech"],
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const twiml = generateTwiML({
      say: {
        text: `Great! I can book a ${serviceName} for you. The next available time is tomorrow at 9 AM. Press 1 to confirm this time, or press 2 to hear other options.`,
      },
      gather: {
        action: `/api/voice/confirm-booking?service=${service.id}&time=${tomorrow.toISOString()}`,
        numDigits: 1,
        timeout: 10,
      },
    });

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  });
}
