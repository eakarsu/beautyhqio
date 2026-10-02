import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { endpoint } from "@/lib/operations/core";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// Provider-initiated (Twilio voicemail recording). Signature-gated.
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

    const recordingUrl = formData.get("RecordingUrl") as string;
    const recordingSid = formData.get("RecordingSid") as string;
    const recordingDuration = formData.get("RecordingDuration") as string;
    const from = formData.get("From") as string;
    const callSid = formData.get("CallSid") as string;

    const client = await prisma.client.findFirst({
      where: {
        phone: {
          contains: from.replace(/\D/g, "").slice(-10),
        },
      },
      select: { id: true, businessId: true },
    });

    if (client) {
      await prisma.activity.create({
        data: {
          clientId: client.id,
          type: "CALL_LOGGED",
          title: "Voicemail received",
          description: `${recordingDuration} second voicemail from ${from}`,
          metadata: {
            recordingUrl,
            recordingSid,
            recordingDuration: parseInt(recordingDuration),
            from,
            callSid,
            businessId: client.businessId,
          },
        },
      });
    }

    const twiml = generateTwiML({
      say: {
        text: "Thank you for your message. We'll get back to you as soon as possible. Goodbye!",
      },
      hangup: true,
    });

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  });
}
