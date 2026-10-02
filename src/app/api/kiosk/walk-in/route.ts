import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { endpoint } from "@/lib/operations/core";
import { resolveKioskLocation } from "@/lib/operations/kiosk-token";

/**
 * PUBLIC (kiosk-token) ENDPOINT — waitlist walk-in check-in.
 *
 * A kiosk is a public browser with no signed-in user, so context() does not
 * apply. Instead the device presents an `x-kiosk-token`, an HMAC bound to exactly
 * one location (see `src/lib/operations/kiosk-token.ts`). Every read and write
 * below is scoped to that location's business, and any caller-supplied
 * locationId is ignored. The response exposes only the waitlist position the
 * kiosk needs to display.
 *
 * Body: { firstName, lastName?, phone, serviceIds?: string[], notes? }
 */
const walkInInput = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional().default(""),
  phone: z.string().trim().min(7).max(30),
  serviceIds: z.array(z.string().trim().min(1).max(191)).max(20).optional().default([]),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const location = await resolveKioskLocation(
      prisma,
      request.headers.get("x-kiosk-token")
    );

    const input = walkInInput.parse(await request.json().catch(() => ({})));
    const phone = input.phone.replace(/\s+/g, " ");

    // Find or create the client within the kiosk's business.
    let client = await prisma.client.findFirst({
      where: {
        businessId: location.businessId,
        OR: [{ phone }, { mobile: phone }],
      },
      select: { id: true },
    });
    if (!client) {
      client = await prisma.client.create({
        data: {
          businessId: location.businessId,
          firstName: input.firstName,
          lastName: input.lastName,
          phone,
          referralSource: "walk_in",
        },
        select: { id: true },
      });
    }

    // Resolve service durations within the kiosk's business.
    const services = input.serviceIds.length
      ? await prisma.service.findMany({
          where: { id: { in: input.serviceIds }, businessId: location.businessId },
          select: { id: true, name: true, duration: true },
        })
      : [];
    const totalDuration = services.reduce((s, sv) => s + sv.duration, 0) || 30;
    const serviceNotes =
      services.map((s) => s.name).join(", ") +
      (input.notes ? ` - ${input.notes}` : "");

    // Next position within this location.
    const lastEntry = await prisma.waitlistEntry.findFirst({
      where: {
        locationId: location.id,
        status: { in: ["WAITING", "NOTIFIED"] },
      },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = lastEntry ? lastEntry.position + 1 : 1;
    const estimatedWait = (position - 1) * 15;

    const entry = await prisma.waitlistEntry.create({
      data: {
        locationId: location.id,
        clientId: client.id,
        position,
        estimatedWait,
        serviceNotes,
        estimatedDuration: totalDuration,
        phone,
      },
      select: { id: true, status: true },
    });

    return { ...entry, position, estimatedWait };
  });
}
