import { NextRequest, NextResponse } from "next/server";
import { generateTwiML } from "@/lib/twilio";

// POST /api/voice/transfer - Transfer call to staff
export async function POST(request: NextRequest) {
  try {
    // In production, this would dial the business phone number
    const businessPhone = process.env.BUSINESS_PHONE_NUMBER;

    let twiml: string;

    if (businessPhone) {
      // Create TwiML to dial the business
      const VoiceResponse = (await import("twilio")).default.twiml.VoiceResponse;
      const response = new VoiceResponse();

      response.say(
        { voice: "Polly.Joanna" },
        "Please hold while I connect you."
      );

      response.dial(
        {
          timeout: 30,
          callerId: process.env.TWILIO_PHONE_NUMBER,
        },
        businessPhone
      );

      // If no answer, leave voicemail option
      response.say(
        { voice: "Polly.Joanna" },
        "Sorry, no one is available to take your call. Please leave a message after the beep."
      );

      response.record({
        maxLength: 120,
        action: "/api/voice/voicemail",
        transcribe: true,
        transcribeCallback: "/api/voice/transcription",
      });

      twiml = response.toString();
    } else {
      // No business phone configured
      twiml = generateTwiML({
        say: {
          text: "I'm sorry, our staff is currently unavailable. Please leave a message after the beep and we'll call you back.",
        },
      });

      // Add recording
      const VoiceResponse = (await import("twilio")).default.twiml.VoiceResponse;
      const response = new VoiceResponse();

      response.say(
        { voice: "Polly.Joanna" },
        "I'm sorry, our staff is currently unavailable. Please leave a message after the beep and we'll call you back."
      );

      response.record({
        maxLength: 120,
        action: "/api/voice/voicemail",
        transcribe: true,
        transcribeCallback: "/api/voice/transcription",
      });

      twiml = response.toString();
    }

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error in transfer:", error);

    const errorTwiml = generateTwiML({
      say: {
        text: "I'm sorry, I'm unable to transfer your call right now. Please try again later.",
      },
      hangup: true,
    });

    return new NextResponse(errorTwiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
