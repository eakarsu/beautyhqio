import { NextRequest, NextResponse } from "next/server";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// POST /api/voice/book - Handle booking request
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const digits = formData.get("Digits") as string;
    const speechResult = formData.get("SpeechResult") as string;
    const from = formData.get("From") as string;
    const callSid = formData.get("CallSid") as string;

    const input = digits || speechResult?.toLowerCase();

    // Map input to service
    let serviceName = "";
    if (input === "1" || input?.includes("haircut") || input?.includes("cut")) {
      serviceName = "Haircut";
    } else if (input === "2" || input?.includes("color") || input?.includes("dye")) {
      serviceName = "Hair Color";
    } else if (input === "3" || input?.includes("manicure") || input?.includes("nails")) {
      serviceName = "Manicure";
    } else if (input?.includes("pedicure")) {
      serviceName = "Pedicure";
    } else if (input?.includes("facial")) {
      serviceName = "Facial";
    } else if (input?.includes("massage")) {
      serviceName = "Massage";
    }

    if (!serviceName) {
      const twiml = generateTwiML({
        say: {
          text: "I didn't catch that. Please press 1 for haircut, 2 for color, or 3 for manicure.",
        },
        gather: {
          action: "/api/voice/book",
          numDigits: 1,
          timeout: 10,
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Find the service
    const service = await prisma.service.findFirst({
      where: {
        name: {
          contains: serviceName,
          mode: "insensitive",
        },
        isActive: true,
      },
    });

    if (!service) {
      const twiml = generateTwiML({
        say: {
          text: `I'm sorry, ${serviceName} is not currently available. Would you like to book a different service?`,
        },
        gather: {
          action: "/api/voice/book",
          timeout: 10,
          input: ["dtmf", "speech"],
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Find next available slot
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    // Store booking intent in session (using call metadata)
    // In a real implementation, you'd use a session store
    const twiml = generateTwiML({
      say: {
        text: `Great! I can book a ${serviceName} for you. The next available time is tomorrow at 9 AM. Press 1 to confirm this time, or press 2 to hear other options.`,
      },
      gather: {
        action: `/api/voice/confirm-booking?service=${service.id}&time=${tomorrow.toISOString()}`,
        numDigits: 1,
        timeout: 10,
      },
    });

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error in booking flow:", error);

    const errorTwiml = generateTwiML({
      say: {
        text: "I'm sorry, I'm having trouble processing your request. Let me connect you with someone who can help.",
      },
      redirect: "/api/voice/transfer",
    });

    return new NextResponse(errorTwiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
