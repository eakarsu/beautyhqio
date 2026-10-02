import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { endpoint } from "@/lib/operations/core";
import { generateTwiML, voiceGreetings } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// Provider-initiated (Twilio voice webhook). Requests are authenticated with the
// Twilio request signature; without a configured shared secret we fail closed.
//
// NOTE: the schema has no Twilio-number -> business mapping, so the business is
// derived from the matched client record. Signature verification is the gate.
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

    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const callSid = formData.get("CallSid") as string;

    // Try to find the client by phone number within a business.
    const client = await prisma.client.findFirst({
      where: {
        phone: {
          contains: from.replace(/\D/g, "").slice(-10),
        },
      },
      select: {
        id: true,
        businessId: true,
        firstName: true,
        lastName: true,
        preferredLanguage: true,
      },
    });

    const language = client?.preferredLanguage || "en";

    const greeting =
      voiceGreetings[language as keyof typeof voiceGreetings] ||
      voiceGreetings.en;

    const twiml = generateTwiML({
      gather: {
        action: "/api/voice/menu",
        numDigits: 1,
        timeout: 10,
        input: ["dtmf", "speech"],
      },
      say: {
        text: greeting,
        voice: "Polly.Joanna",
        language: language === "en" ? "en-US" : language,
      },
    });

    if (client) {
      await prisma.activity.create({
        data: {
          clientId: client.id,
          type: "CALL_LOGGED",
          title: "Incoming call",
          description: `Call from ${from}`,
          metadata: {
            callSid,
            from,
            to,
            businessId: client.businessId,
          },
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
