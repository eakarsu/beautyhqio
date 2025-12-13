import { NextRequest, NextResponse } from "next/server";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// POST /api/voice/voicemail - Handle voicemail recording
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const recordingUrl = formData.get("RecordingUrl") as string;
    const recordingSid = formData.get("RecordingSid") as string;
    const recordingDuration = formData.get("RecordingDuration") as string;
    const from = formData.get("From") as string;
    const callSid = formData.get("CallSid") as string;

    console.log(`Voicemail received from ${from}, duration: ${recordingDuration}s`);

    // Try to find the client
    const client = await prisma.client.findFirst({
      where: {
        phone: {
          contains: from.replace(/\D/g, "").slice(-10),
        },
      },
    });

    // Log the voicemail if client exists (clientId is required)
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
          },
        },
      });
    }

    // Generate thank you response
    const twiml = generateTwiML({
      say: {
        text: "Thank you for your message. We'll get back to you as soon as possible. Goodbye!",
      },
      hangup: true,
    });

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error handling voicemail:", error);

    const twiml = generateTwiML({
      say: {
        text: "Thank you for your message. Goodbye!",
      },
      hangup: true,
    });

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
