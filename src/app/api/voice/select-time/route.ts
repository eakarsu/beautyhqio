import { NextRequest, NextResponse } from "next/server";
import { generateTwiML } from "@/lib/twilio";

// POST /api/voice/select-time - Handle time selection from alternative options
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const digits = formData.get("Digits") as string;

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("service");
    const option1 = searchParams.get("option1");
    const option2 = searchParams.get("option2");

    let selectedTime: string | null = null;

    if (digits === "1" && option1) {
      selectedTime = option1;
    } else if (digits === "2" && option2) {
      selectedTime = option2;
    }

    if (selectedTime && serviceId) {
      // Redirect to confirm-booking with the selected time
      const twiml = generateTwiML({
        say: {
          text: "You've selected that time. Press 1 to confirm this appointment, or press 2 for other options.",
        },
        gather: {
          action: `/api/voice/confirm-booking?service=${serviceId}&time=${selectedTime}`,
          numDigits: 1,
          timeout: 10,
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    } else {
      // Invalid selection
      const twiml = generateTwiML({
        say: {
          text: "I didn't understand that. Press 1 for 11 AM, or press 2 for 2 PM.",
        },
        gather: {
          action: `/api/voice/select-time?service=${serviceId}&option1=${option1}&option2=${option2}`,
          numDigits: 1,
          timeout: 10,
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }
  } catch (error) {
    console.error("Error in select-time:", error);

    const errorTwiml = generateTwiML({
      say: {
        text: "I'm sorry, there was an error. Please try again.",
      },
      redirect: "/api/voice/menu",
    });

    return new NextResponse(errorTwiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
