import { NextRequest, NextResponse } from "next/server";
import { generateTwiML, voiceGreetings } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// POST /api/voice/incoming - Handle incoming voice calls
export async function POST(request: NextRequest) {
  console.log("========================================");
  console.log("[TWILIO CALL] Incoming call received");
  console.log("[TWILIO CALL] Timestamp:", new Date().toISOString());

  try {
    const formData = await request.formData();
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const direction = formData.get("Direction") as string;
    const callerCity = formData.get("CallerCity") as string;
    const callerState = formData.get("CallerState") as string;
    const callerCountry = formData.get("CallerCountry") as string;

    console.log("[TWILIO CALL] Call Details:");
    console.log("  - CallSid:", callSid);
    console.log("  - From:", from);
    console.log("  - To:", to);
    console.log("  - Status:", callStatus);
    console.log("  - Direction:", direction);
    console.log("  - Caller Location:", callerCity, callerState, callerCountry);
    console.log("[TWILIO CALL] All form data:", Object.fromEntries(formData.entries()));

    // Try to find the client by phone number
    console.log("[TWILIO CALL] Searching for client with phone:", from);
    const client = await prisma.client.findFirst({
      where: {
        phone: {
          contains: from.replace(/\D/g, "").slice(-10),
        },
      },
    });

    if (client) {
      console.log("[TWILIO CALL] Client found:", client.firstName, client.lastName, "(ID:", client.id, ")");
    } else {
      console.log("[TWILIO CALL] No client found for this phone number");
    }

    // Determine language preference
    const language = client?.preferredLanguage || "en";
    console.log("[TWILIO CALL] Using language:", language);

    const greeting =
      voiceGreetings[language as keyof typeof voiceGreetings] ||
      voiceGreetings.en;
    console.log("[TWILIO CALL] Greeting message:", greeting);

    // Generate TwiML response
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

    console.log("[TWILIO CALL] Generated TwiML response");
    console.log("[TWILIO CALL] TwiML:", twiml);

    // Log the call if client exists
    if (client) {
      console.log("[TWILIO CALL] Logging activity for client");
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
          },
        },
      });
      console.log("[TWILIO CALL] Activity logged successfully");
    }

    console.log("[TWILIO CALL] Sending TwiML response to Twilio");
    console.log("========================================");

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("========================================");
    console.error("[TWILIO CALL ERROR] Error handling incoming call:");
    console.error("[TWILIO CALL ERROR]", error);
    console.error("========================================");

    // Return error TwiML
    const errorTwiml = generateTwiML({
      say: {
        text: "We're sorry, but we're experiencing technical difficulties. Please try again later.",
      },
      hangup: true,
    });

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}
