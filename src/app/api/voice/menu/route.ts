import { NextRequest, NextResponse } from "next/server";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// POST /api/voice/menu - Handle menu selection
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const digits = formData.get("Digits") as string;
    const speechResult = formData.get("SpeechResult") as string;
    const from = formData.get("From") as string;

    console.log(`Menu input - Digits: ${digits}, Speech: ${speechResult}`);

    let twiml: string;

    // Process input (DTMF or speech)
    const input = digits || speechResult?.toLowerCase();

    if (input === "1" || input?.includes("book") || input?.includes("appointment")) {
      // Book an appointment
      twiml = generateTwiML({
        say: {
          text: "Let me help you book an appointment. Please say the service you'd like to book, or press 1 for haircut, 2 for color, 3 for manicure.",
        },
        gather: {
          action: "/api/voice/book",
          timeout: 10,
          input: ["dtmf", "speech"],
        },
      });
    } else if (input === "2" || input?.includes("check") || input?.includes("status")) {
      // Check appointment status
      const client = await prisma.client.findFirst({
        where: {
          phone: {
            contains: from.replace(/\D/g, "").slice(-10),
          },
        },
        include: {
          appointments: {
            where: {
              scheduledStart: {
                gte: new Date(),
              },
              status: {
                in: ["CONFIRMED", "BOOKED"],
              },
            },
            include: {
              services: { include: { service: true } },
            },
            orderBy: {
              scheduledStart: "asc",
            },
            take: 1,
          },
        },
      });

      if (client?.appointments?.[0]) {
        const apt = client.appointments[0];
        const date = new Date(apt.scheduledStart).toLocaleDateString();
        const time = new Date(apt.scheduledStart).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const serviceName = apt.services[0]?.service?.name || "appointment";

        twiml = generateTwiML({
          say: {
            text: `You have a ${serviceName} appointment scheduled for ${date} at ${time}. Press 1 to confirm, 2 to reschedule, or 3 to cancel.`,
          },
          gather: {
            action: "/api/voice/appointment-action",
            numDigits: 1,
            timeout: 10,
          },
        });
      } else {
        twiml = generateTwiML({
          say: {
            text: "I don't see any upcoming appointments for this phone number. Would you like to book one? Press 1 to book, or 3 to speak with someone.",
          },
          gather: {
            action: "/api/voice/menu",
            numDigits: 1,
            timeout: 10,
          },
        });
      }
    } else if (input === "3" || input?.includes("speak") || input?.includes("human") || input?.includes("person")) {
      // Transfer to human
      twiml = generateTwiML({
        say: {
          text: "Please hold while I connect you to a staff member.",
        },
        redirect: "/api/voice/transfer",
      });
    } else {
      // Invalid input, repeat menu
      twiml = generateTwiML({
        say: {
          text: "I didn't understand that. Press 1 to book an appointment, 2 to check your appointment, or 3 to speak with someone.",
        },
        gather: {
          action: "/api/voice/menu",
          numDigits: 1,
          timeout: 10,
        },
      });
    }

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Error processing menu:", error);

    const errorTwiml = generateTwiML({
      say: {
        text: "We're sorry, something went wrong. Please try again.",
      },
      redirect: "/api/voice/incoming",
    });

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}
