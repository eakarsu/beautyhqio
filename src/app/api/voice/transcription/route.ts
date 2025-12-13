import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/voice/transcription - Handle voicemail transcription
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const transcriptionText = formData.get("TranscriptionText") as string;
    const transcriptionStatus = formData.get("TranscriptionStatus") as string;
    const recordingSid = formData.get("RecordingSid") as string;
    const from = formData.get("From") as string;

    console.log(`Transcription received for ${recordingSid}: ${transcriptionStatus}`);

    if (transcriptionStatus === "completed" && transcriptionText) {
      // Find the activity with this recording
      const activity = await prisma.activity.findFirst({
        where: {
          metadata: {
            path: ["recordingSid"],
            equals: recordingSid,
          },
        },
      });

      if (activity) {
        // Update the activity with transcription
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
      } else {
        // Create new activity if original not found
        const client = await prisma.client.findFirst({
          where: {
            phone: {
              contains: from?.replace(/\D/g, "").slice(-10) || "",
            },
          },
        });

        // Only create activity if client exists (clientId is required)
        if (client) {
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
              },
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling transcription:", error);
    return NextResponse.json(
      { error: "Failed to process transcription" },
      { status: 500 }
    );
  }
}
