import { NextRequest, NextResponse } from "next/server";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// POST /api/voice/appointment-action - Handle appointment actions (confirm/reschedule/cancel)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const digits = formData.get("Digits") as string;
    const from = formData.get("From") as string;

    // Find client and their next appointment
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

    const appointment = client?.appointments?.[0];

    if (!appointment) {
      const twiml = generateTwiML({
        say: {
          text: "I couldn't find your appointment. Would you like to book a new one?",
        },
        gather: {
          action: "/api/voice/menu",
          numDigits: 1,
          timeout: 10,
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    let twiml: string;

    switch (digits) {
      case "1":
        // Confirm appointment
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: "CONFIRMED" },
        });

        twiml = generateTwiML({
          say: {
            text: "Your appointment has been confirmed. We look forward to seeing you! Is there anything else I can help you with? Press 1 to book another appointment, or press 3 to speak with someone.",
          },
          gather: {
            action: "/api/voice/menu",
            numDigits: 1,
            timeout: 5,
          },
        });

        // Add fallback
        twiml = twiml.replace(
          "</Response>",
          "<Say voice=\"Polly.Joanna\">Thank you for calling. Goodbye!</Say><Hangup/></Response>"
        );
        break;

      case "2":
        // Reschedule - offer new times
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        dayAfter.setHours(9, 0, 0, 0);

        twiml = generateTwiML({
          say: {
            text: `I can reschedule your ${appointment.services[0]?.service?.name || "appointment"}. Press 1 for tomorrow at 9 AM, or press 2 for the day after tomorrow at 9 AM.`,
          },
          gather: {
            action: `/api/voice/reschedule?appointmentId=${appointment.id}&option1=${tomorrow.toISOString()}&option2=${dayAfter.toISOString()}`,
            numDigits: 1,
            timeout: 10,
          },
        });
        break;

      case "3":
        // Cancel appointment
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: "CANCELLED" },
        });

        // Log activity
        const cancelledServiceName = appointment.services[0]?.service?.name || "appointment";
        await prisma.activity.create({
          data: {
            clientId: client!.id,
            type: "APPOINTMENT_CANCELLED",
            title: "Appointment cancelled via phone",
            description: `${cancelledServiceName} appointment cancelled`,
            metadata: {
              appointmentId: appointment.id,
            },
          },
        });

        twiml = generateTwiML({
          say: {
            text: "Your appointment has been cancelled. Would you like to book a new appointment? Press 1 for yes, or press any other key to end the call.",
          },
          gather: {
            action: "/api/voice/menu",
            numDigits: 1,
            timeout: 5,
          },
        });

        twiml = twiml.replace(
          "</Response>",
          "<Say voice=\"Polly.Joanna\">Thank you for calling. Goodbye!</Say><Hangup/></Response>"
        );
        break;

      default:
        twiml = generateTwiML({
          say: {
            text: "I didn't understand that. Press 1 to confirm, 2 to reschedule, or 3 to cancel your appointment.",
          },
          gather: {
            action: "/api/voice/appointment-action",
            numDigits: 1,
            timeout: 10,
          },
        });
    }

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error in appointment action:", error);

    const errorTwiml = generateTwiML({
      say: {
        text: "I'm sorry, there was an error processing your request. Please try again.",
      },
      redirect: "/api/voice/menu",
    });

    return new NextResponse(errorTwiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
