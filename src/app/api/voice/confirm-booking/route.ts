import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { generateTwiML } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";
import { endpoint, fail } from "@/lib/operations/core";

/**
 * Provider-initiated Twilio IVR callback (confirm a phone booking).
 *
 * Twilio calls this, not a signed-in user, so context() does not apply. Requests
 * are authenticated by validating the `X-Twilio-Signature` header against the
 * Twilio auth token: the route fails closed (503) when the token is not
 * configured and returns 403 when the signature does not match.
 *
 * TODO: when served behind a proxy/CDN, set TWILIO_WEBHOOK_BASE_URL to the exact
 * public webhook URL Twilio signs, otherwise signature validation will reject
 * legitimate callbacks (the fallback is the request URL as seen by this server).
 *
 * NOTE: in production src/middleware.ts retires this legacy write with 410 unless
 * ENABLE_LEGACY_APPOINTMENT_WRITES=true. The governed replacement is
 * /api/appointments.
 */
function verifyTwilioSignature(
  request: NextRequest,
  params: Record<string, string>
): void {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    fail(503, "Voice webhook is not configured on this deployment");
  }
  const signature = request.headers.get("x-twilio-signature");
  if (!signature) fail(401, "Missing Twilio signature");

  const base = process.env.TWILIO_WEBHOOK_BASE_URL?.replace(/\/$/, "");
  const url = base
    ? `${base}${request.nextUrl.pathname}${request.nextUrl.search}`
    : request.url;

  if (!twilio.validateRequest(authToken, signature, url, params)) {
    fail(403, "Invalid Twilio signature");
  }
}

// POST /api/voice/confirm-booking - Confirm the booking
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const formData = await request.formData();
    const digits = formData.get("Digits") as string;
    const from = formData.get("From") as string;

    // Verify the provider before touching any data.
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") params[key] = value;
    });
    verifyTwilioSignature(request, params);

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("service");
    const timeStr = searchParams.get("time");

    try {
      if (digits === "1" && serviceId && timeStr) {
        // Confirm booking
        const startTime = new Date(timeStr);

        // Get service for duration and owning business
        const service = await prisma.service.findFirst({
          where: { id: serviceId },
        });

        if (!service) {
          throw new Error("Service not found");
        }
        const businessId = service.businessId;

        // Get or create client for this business
        let client = await prisma.client.findFirst({
          where: {
            businessId,
            phone: {
              contains: from.replace(/\D/g, "").slice(-10),
            },
          },
        });

        if (!client) {
          // Create a new client with phone number
          client = await prisma.client.create({
            data: {
              firstName: "Phone",
              lastName: "Customer",
              phone: from,
              referralSource: "Phone Call",
              businessId,
            },
          });
        }

        // Find an available staff member in the same business
        const staff = await prisma.staff.findFirst({
          where: {
            isActive: true,
            serviceIds: {
              has: serviceId,
            },
            location: { businessId },
          },
          select: {
            id: true,
            displayName: true,
            locationId: true,
          },
        });

        if (!staff) {
          const twiml = generateTwiML({
            say: {
              text: "I'm sorry, no staff members are available for this service. Please call back during business hours to speak with someone.",
            },
            hangup: true,
          });

          return new NextResponse(twiml, {
            headers: { "Content-Type": "text/xml" },
          });
        }

        // Create the appointment
        const endTime = new Date(startTime.getTime() + service.duration * 60000);

        const appointment = await prisma.appointment.create({
          data: {
            clientId: client.id,
            staffId: staff.id,
            locationId: staff.locationId,
            businessId,
            scheduledStart: startTime,
            scheduledEnd: endTime,
            status: "BOOKED",
            notes: "Booked via phone",
            services: {
              create: {
                serviceId: serviceId,
                price: service.price,
                duration: service.duration,
              },
            },
          },
        });

        const dateStr = startTime.toLocaleDateString();
        const timeStrFormatted = startTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const staffDisplayName = staff.displayName || "our team member";

        const twiml = generateTwiML({
          say: {
            text: `Your ${service.name} appointment has been booked for ${dateStr} at ${timeStrFormatted} with ${staffDisplayName}. You'll receive a confirmation text shortly. Thank you for choosing us!`,
          },
          hangup: true,
        });

        // Log activity
        await prisma.activity.create({
          data: {
            clientId: client.id,
            type: "APPOINTMENT_BOOKED",
            title: "Appointment booked via phone",
            description: `${service.name} on ${dateStr} at ${timeStrFormatted}`,
            metadata: {
              appointmentId: appointment.id,
            },
          },
        });

        return new NextResponse(twiml, {
          headers: { "Content-Type": "text/xml" },
        });
      } else if (digits === "2") {
        // User wants other options
        const baseTime = new Date(timeStr || new Date());

        // Offer alternative times
        const option1 = new Date(baseTime);
        option1.setHours(11, 0, 0, 0);

        const option2 = new Date(baseTime);
        option2.setHours(14, 0, 0, 0);

        const twiml = generateTwiML({
          say: {
            text: "I also have availability at 11 AM or 2 PM. Press 1 for 11 AM, or press 2 for 2 PM.",
          },
          gather: {
            action: `/api/voice/select-time?service=${serviceId}&option1=${option1.toISOString()}&option2=${option2.toISOString()}`,
            numDigits: 1,
            timeout: 10,
          },
        });

        return new NextResponse(twiml, {
          headers: { "Content-Type": "text/xml" },
        });
      } else {
        // Invalid input
        const twiml = generateTwiML({
          say: {
            text: "I didn't understand that. Press 1 to confirm the appointment, or press 2 for other time options.",
          },
          gather: {
            action: `/api/voice/confirm-booking?service=${serviceId}&time=${timeStr}`,
            numDigits: 1,
            timeout: 10,
          },
        });

        return new NextResponse(twiml, {
          headers: { "Content-Type": "text/xml" },
        });
      }
    } catch (error) {
      console.error("Error confirming booking:", error);

      const errorTwiml = generateTwiML({
        say: {
          text: "I'm sorry, there was a problem completing your booking. Please try again or speak with someone directly.",
        },
        redirect: "/api/voice/transfer",
      });

      return new NextResponse(errorTwiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }
  });
}
