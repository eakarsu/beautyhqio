import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

// POST /api/voice/outgoing - Handle outgoing browser calls
export async function POST(request: NextRequest) {
  console.log("========================================");
  console.log("[TWILIO OUTGOING] Browser call initiated");
  console.log("[TWILIO OUTGOING] Timestamp:", new Date().toISOString());

  let to = process.env.TWILIO_PHONE_NUMBER;
  let from = "";
  let callSid = "";

  try {
    const formData = await request.formData();
    to = formData.get("To") as string || process.env.TWILIO_PHONE_NUMBER;
    from = formData.get("From") as string || "";
    callSid = formData.get("CallSid") as string || "";
    console.log("[TWILIO OUTGOING] All form data:", Object.fromEntries(formData.entries()));
  } catch {
    console.log("[TWILIO OUTGOING] No form data (direct request)");
  }

  console.log("[TWILIO OUTGOING] Call Details:");
  console.log("  - CallSid:", callSid);
  console.log("  - From (browser identity):", from);
  console.log("  - To:", to);

  try {

    const twiml = new VoiceResponse();

    // Respond directly to the browser caller with the AI greeting
    twiml.say(
      {
        voice: "Polly.Joanna",
        language: "en-US",
      },
      "Thank you for calling Serenity Salon and Spa. How may I help you today?"
    );

    // Pause briefly
    twiml.pause({ length: 1 });

    twiml.say(
      {
        voice: "Polly.Joanna",
        language: "en-US",
      },
      "Press 1 to book an appointment, press 2 to check your appointment status, or press 3 to speak with a staff member."
    );

    // Gather user input with longer timeout
    const gather = twiml.gather({
      numDigits: 1,
      timeout: 30,
      input: ["dtmf", "speech"],
    });

    gather.say(
      {
        voice: "Polly.Joanna",
        language: "en-US",
      },
      "Please make a selection or tell me how I can help you."
    );

    // If no input, repeat the menu
    twiml.say(
      {
        voice: "Polly.Joanna",
        language: "en-US",
      },
      "I didn't catch that. Goodbye."
    );

    const twimlString = twiml.toString();
    console.log("[TWILIO OUTGOING] Generated TwiML:", twimlString);
    console.log("========================================");

    return new NextResponse(twimlString, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("========================================");
    console.error("[TWILIO OUTGOING ERROR] Error handling outgoing call:");
    console.error("[TWILIO OUTGOING ERROR]", error);
    console.error("========================================");

    const twiml = new VoiceResponse();
    twiml.say("We're sorry, but we're experiencing technical difficulties. Please try again later.");
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}
