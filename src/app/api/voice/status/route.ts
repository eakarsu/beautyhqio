import { NextResponse } from "next/server";

// GET /api/voice/status - Check Twilio configuration status
export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  const isConfigured = !!(
    accountSid &&
    authToken &&
    phoneNumber &&
    accountSid !== "your_account_sid" &&
    authToken !== "your_auth_token"
  );

  console.log("[Twilio Status] Checking configuration...");
  console.log("[Twilio Status] Account SID configured:", !!accountSid && accountSid !== "your_account_sid");
  console.log("[Twilio Status] Auth Token configured:", !!authToken && authToken !== "your_auth_token");
  console.log("[Twilio Status] Phone Number:", phoneNumber);
  console.log("[Twilio Status] Overall status:", isConfigured ? "CONFIGURED" : "NOT CONFIGURED");

  return NextResponse.json({
    isConfigured,
    phoneNumber: phoneNumber || null,
  });
}
