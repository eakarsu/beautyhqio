import { NextRequest } from "next/server";
import { endpoint, fail } from "@/lib/operations/core";
import { resolveKioskLocation } from "@/lib/operations/kiosk-token";
import { prisma } from "@/lib/prisma";

// POST /api/kiosk/lookup
// Kiosk check-in lookup. Previously public with an optional location and no
// throttle, so any caller could enumerate clients by phone number across every
// business. Now requires a kiosk token bound to a single location, and all
// queries are scoped to that location's business.
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const token = request.headers.get("x-kiosk-token");
    const location = await resolveKioskLocation(prisma, token);

    const body = await request.json().catch(() => ({}));
    const phone = String(body?.phone || "").replace(/\D/g, "");

    // Require a full 10-digit US number: short prefixes made enumeration cheap.
    if (phone.length !== 10 && phone.length !== 11) {
      return fail(400, "A valid 10-digit phone number is required");
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const phoneVariants = [
      phone,
      `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`,
      `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6, 10)}`,
      `+1${phone}`,
      `1${phone}`,
    ];

    const appointments = await prisma.appointment.findMany({
      where: {
        // Scope to this kiosk's own business and location.
        businessId: location.businessId,
        locationId: location.id,
        scheduledStart: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        OR: [
          { client: { phone: { in: phoneVariants } } },
          { client: { mobile: { in: phoneVariants } } },
          { clientPhone: { in: phoneVariants } },
        ],
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        staff: {
          select: {
            id: true,
            displayName: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        services: {
          include: { service: { select: { id: true, name: true, duration: true } } },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    return appointments;
  });
}
