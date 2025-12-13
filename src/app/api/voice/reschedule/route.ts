import { NextRequest, NextResponse } from "next/server";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";

// POST /api/voice/reschedule - Handle appointment rescheduling
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const digits = formData.get("Digits") as string;

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");
    const option1 = searchParams.get("option1");
    const option2 = searchParams.get("option2");

    if (!appointmentId) {
      const twiml = generateTwiML({
        say: {
          text: "I'm sorry, I couldn't find your appointment. Let me transfer you to someone who can help.",
        },
        redirect: "/api/voice/transfer",
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        services: { include: { service: true } },
        client: true,
      },
    });

    if (!appointment) {
      const twiml = generateTwiML({
        say: {
          text: "I couldn't find your appointment. Please try again.",
        },
        redirect: "/api/voice/menu",
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const appointmentService = appointment.services[0]?.service;
    const serviceName = appointmentService?.name || "appointment";
    const serviceDuration = appointmentService?.duration || 60;

    let newTime: Date;

    if (digits === "1" && option1) {
      newTime = new Date(option1);
    } else if (digits === "2" && option2) {
      newTime = new Date(option2);
    } else {
      const twiml = generateTwiML({
        say: {
          text: "I didn't understand that. Press 1 for the first option, or press 2 for the second option.",
        },
        gather: {
          action: `/api/voice/reschedule?appointmentId=${appointmentId}&option1=${option1}&option2=${option2}`,
          numDigits: 1,
          timeout: 10,
        },
      });

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Calculate new end time
    const newEndTime = new Date(
      newTime.getTime() + serviceDuration * 60000
    );

    // Update the appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledStart: newTime,
        scheduledEnd: newEndTime,
        status: "CONFIRMED",
      },
    });

    const dateStr = newTime.toLocaleDateString();
    const timeStr = newTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Log activity
    if (appointment.clientId) {
      await prisma.activity.create({
        data: {
          clientId: appointment.clientId,
          type: "APPOINTMENT_BOOKED",
          title: "Appointment rescheduled via phone",
          description: `${serviceName} rescheduled to ${dateStr} at ${timeStr}`,
          metadata: {
            appointmentId,
            oldTime: appointment.scheduledStart.toISOString(),
            newTime: newTime.toISOString(),
          },
        },
      });
    }

    const twiml = generateTwiML({
      say: {
        text: `Your ${serviceName} has been rescheduled to ${dateStr} at ${timeStr}. You'll receive a confirmation text shortly. Is there anything else I can help you with?`,
      },
      gather: {
        action: "/api/voice/menu",
        numDigits: 1,
        timeout: 5,
      },
    });

    // Add hangup fallback
    const finalTwiml = twiml.replace(
      "</Response>",
      "<Say voice=\"Polly.Joanna\">Thank you for calling. Goodbye!</Say><Hangup/></Response>"
    );

    return new NextResponse(finalTwiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error rescheduling:", error);

    const errorTwiml = generateTwiML({
      say: {
        text: "I'm sorry, there was an error rescheduling your appointment. Let me connect you with someone who can help.",
      },
      redirect: "/api/voice/transfer",
    });

    return new NextResponse(errorTwiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
