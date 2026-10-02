import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { endpoint } from "@/lib/operations/core";
import { prisma } from "@/lib/prisma";

// Provider-initiated (Twilio voicemail transcription callback). Signature-gated.
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

    const transcriptionText = formData.get("TranscriptionText") as string;
    const transcriptionStatus = formData.get("TranscriptionStatus") as string;
    const recordingSid = formData.get("RecordingSid") as string;
    const from = formData.get("From") as string;

    if (transcriptionStatus === "completed" && transcriptionText) {
      // Resolve the caller's client first, then scope the activity to that client.
      const client = from
        ? await prisma.client.findFirst({
            where: {
              phone: {
                contains: from.replace(/\D/g, "").slice(-10),
              },
            },
            select: { id: true, businessId: true },
          })
        : null;

      const activity = client
        ? await prisma.activity.findFirst({
            where: {
              clientId: client.id,
              metadata: {
                path: ["recordingSid"],
                equals: recordingSid,
              },
            },
          })
        : null;

      if (activity) {
        const currentMetadata = activity.metadata as Record<string, unknown>;
        await prisma.activity.update({
          where: { id: activity.id },
          data: {
            description: `Voicemail: "${transcriptionText}"`,
            metadata: {
              ...currentMetadata,
              transcription: transcriptionText,
              transcriptionStatus,
            },
          },
        });
      } else if (client) {
        await prisma.activity.create({
          data: {
            clientId: client.id,
            type: "CALL_LOGGED",
            title: "Voicemail transcription",
            description: `Voicemail: "${transcriptionText}"`,
            metadata: {
              recordingSid,
              transcription: transcriptionText,
              transcriptionStatus,
              from,
              businessId: client.businessId,
            },
          },
        });
      }
    }

    return { success: true };
  });
}
