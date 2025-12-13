import { NextRequest, NextResponse } from "next/server";
import { sendBulkSMS } from "@/lib/twilio";

// POST /api/sms/bulk - Send bulk SMS messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "recipients array is required" },
        { status: 400 }
      );
    }

    // Validate each recipient has phone and message
    for (const recipient of recipients) {
      if (!recipient.phone || !recipient.message) {
        return NextResponse.json(
          { error: "Each recipient must have phone and message" },
          { status: 400 }
        );
      }
    }

    const result = await sendBulkSMS(recipients);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error sending bulk SMS:", error);
    return NextResponse.json(
      { error: "Failed to send bulk SMS" },
      { status: 500 }
    );
  }
}
