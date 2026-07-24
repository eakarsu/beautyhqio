import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

type RouteContext = {
  params: Promise<{
    callId: string;
  }>;
};

const TWILIO_CALL_SID_PATTERN = /^CA[a-f0-9]{32}$/i;

// GET /api/voice/call/status/[callId] - Check the status of an outbound Twilio call.
export async function GET(_request: NextRequest, context: RouteContext) {
  const { callId } = await context.params;

  if (!callId) {
    return NextResponse.json(
      { success: false, error: "Call ID is required" },
      { status: 400 }
    );
  }

  if (!TWILIO_CALL_SID_PATTERN.test(callId)) {
    return NextResponse.json({
      success: true,
      callId,
      status: "unknown",
      source: "local",
      message: "Call ID is not a Twilio call SID.",
    });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return NextResponse.json({
      success: false,
      callId,
      status: "unknown",
      configured: false,
      error: "Twilio credentials not configured",
    });
  }

  try {
    const client = twilio(accountSid, authToken);
    const call = await client.calls(callId).fetch();

    return NextResponse.json({
      success: true,
      callId: call.sid,
      status: call.status,
      direction: call.direction,
      from: call.from,
      to: call.to,
      duration: call.duration,
      startTime: call.startTime?.toISOString() ?? null,
      endTime: call.endTime?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[TWILIO CALL STATUS] Failed to fetch call status:", error);

    return NextResponse.json(
      {
        success: false,
        callId,
        status: "unknown",
        error: error instanceof Error ? error.message : "Failed to fetch call status",
      },
      { status: 500 }
    );
  }
}
