import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

// POST /api/voice/token - Generate access token for browser calling
export async function POST(request: NextRequest) {
  console.log("[Twilio Token] Generating access token...");

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY_SID;
  const apiSecret = process.env.TWILIO_API_KEY_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
    console.error("[Twilio Token] Missing credentials:");
    console.error("  - TWILIO_ACCOUNT_SID:", !!accountSid);
    console.error("  - TWILIO_API_KEY_SID:", !!apiKey);
    console.error("  - TWILIO_API_KEY_SECRET:", !!apiSecret);
    console.error("  - TWILIO_TWIML_APP_SID:", !!twimlAppSid);

    return NextResponse.json(
      {
        error: "Twilio credentials not fully configured",
        missing: {
          accountSid: !accountSid,
          apiKey: !apiKey,
          apiSecret: !apiSecret,
          twimlAppSid: !twimlAppSid,
        }
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const identity = body.identity || `user-${Date.now()}`;

    console.log("[Twilio Token] Creating token for identity:", identity);

    const token = new AccessToken(
      accountSid,
      apiKey,
      apiSecret,
      { identity }
    );

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    token.addGrant(voiceGrant);

    console.log("[Twilio Token] Token generated successfully");

    return NextResponse.json({
      token: token.toJwt(),
      identity,
    });
  } catch (error) {
    console.error("[Twilio Token] Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
