import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

// POST /api/voice/call - Initiate a call from Twilio to the user
export async function POST(request: NextRequest) {
  console.log("========================================");
  console.log("[TWILIO CALL] Initiating outbound call");
  console.log("[TWILIO CALL] Timestamp:", new Date().toISOString());

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error("[TWILIO CALL] Missing credentials");
    return NextResponse.json(
      { error: "Twilio credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Phone number (to) is required" },
        { status: 400 }
      );
    }

    console.log("[TWILIO CALL] Calling:", to);
    console.log("[TWILIO CALL] From:", twilioPhoneNumber);

    const client = twilio(accountSid, authToken);

    // Get the base URL for the webhook
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NGROK_URL;

    if (!baseUrl) {
      console.error("[TWILIO CALL] No base URL configured (NEXT_PUBLIC_APP_URL or NGROK_URL)");
      return NextResponse.json(
        { error: "Server URL not configured. Set NEXT_PUBLIC_APP_URL or NGROK_URL in .env" },
        { status: 500 }
      );
    }

    const call = await client.calls.create({
      to: to,
      from: twilioPhoneNumber,
      url: `${baseUrl}/api/voice/incoming`,
      statusCallback: `${baseUrl}/api/voice/status-callback`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });

    console.log("[TWILIO CALL] Call initiated successfully");
    console.log("[TWILIO CALL] Call SID:", call.sid);
    console.log("========================================");

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
    });
  } catch (error) {
    console.error("========================================");
    console.error("[TWILIO CALL ERROR]", error);
    console.error("========================================");

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate call" },
      { status: 500 }
    );
  }
}
