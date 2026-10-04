import { NextRequest } from "next/server";
import { endpoint } from "@/lib/operations/core";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/locations
 *
 * Public, unauthenticated list of bookable locations for the online booking
 * flow. Customers choose a salon before they have an account, so this endpoint
 * cannot require a session — instead it returns a deliberately minimal
 * projection: no tenant internals, no staff, no PII, and only businesses that
 * are actually able to take bookings.
 *
 * The authenticated, staff-facing equivalent is /api/locations.
 */
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const { searchParams } = new URL(request.url);
    const take = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 100);

    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
        allowOnlineBooking: true,
        // Only businesses with a live subscription can take public bookings,
        // matching how the marketplace lists salons.
        business: { subscription: { is: { status: { in: ["ACTIVE", "TRIAL"] } } } },
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        phone: true,
        business: { select: { name: true, type: true, logo: true } },
      },
      take,
      orderBy: { name: "asc" },
    });

    return locations.map((l) => ({
      id: l.id,
      name: l.name,
      address: l.address,
      city: l.city,
      state: l.state,
      zip: l.zip,
      phone: l.phone,
      businessName: l.business?.name ?? null,
      businessType: l.business?.type ?? null,
      logo: l.business?.logo ?? null,
    }));
  });
}
