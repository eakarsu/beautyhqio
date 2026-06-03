import { NextRequest, NextResponse } from "next/server";

type VoiceStatusPayload = {
  callSid: string;
  callStatus: string;
  callDuration: string;
  from: string;
  to: string;
  direction: string;
  timestamp: string;
};

async function readVoiceStatusPayload(request: NextRequest): Promise<VoiceStatusPayload> {
  if (request.method === "GET") {
    const searchParams = request.nextUrl.searchParams;

    return {
      callSid: searchParams.get("CallSid") ?? "",
      callStatus: searchParams.get("CallStatus") ?? "",
      callDuration: searchParams.get("CallDuration") ?? "",
      from: searchParams.get("From") ?? "",
      to: searchParams.get("To") ?? "",
      direction: searchParams.get("Direction") ?? "",
      timestamp: searchParams.get("Timestamp") ?? "",
    };
  }

  const formData = await request.formData();

  return {
    callSid: String(formData.get("CallSid") ?? ""),
    callStatus: String(formData.get("CallStatus") ?? ""),
    callDuration: String(formData.get("CallDuration") ?? ""),
    from: String(formData.get("From") ?? ""),
    to: String(formData.get("To") ?? ""),
    direction: String(formData.get("Direction") ?? ""),
    timestamp: String(formData.get("Timestamp") ?? ""),
  };
}

// POST /api/voice/status-callback - Receive Twilio call lifecycle callbacks.
export async function POST(request: NextRequest) {
  const payload = await readVoiceStatusPayload(request);

  console.log("[TWILIO STATUS CALLBACK]", payload);

  return NextResponse.json({ success: true });
}

// GET is supported for manual checks and providers configured to use GET.
export async function GET(request: NextRequest) {
  const payload = await readVoiceStatusPayload(request);

  console.log("[TWILIO STATUS CALLBACK]", payload);

  return NextResponse.json({ success: true });
}
