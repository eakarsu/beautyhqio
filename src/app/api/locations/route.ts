import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { context, endpoint } from "@/lib/operations/core";

const locationInput = z.object({
  name: z.string().trim().min(1).max(150),
  address: z.string().trim().min(1).max(300),
  address2: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  zip: z.string().trim().min(1).max(20),
  country: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.union([z.string().email().max(200), z.literal("")]).optional().nullable(),
  operatingHours: z.unknown().optional().nullable(),
  latitude: z.coerce.number().finite().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().finite().min(-180).max(180).optional().nullable(),
  allowOnlineBooking: z.boolean().optional(),
  bookingUrl: z.string().trim().max(500).optional().nullable(),
  advanceBookingDays: z.coerce.number().int().min(1).max(365).optional(),
  cancellationHours: z.coerce.number().int().min(0).max(720).optional(),
});

// GET /api/locations - List locations for the caller's business
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = { businessId: ctx.businessId };
    if (isActive !== null) where.isActive = isActive === "true";

    return prisma.location.findMany({
      where,
      orderBy: { name: "asc" },
    });
  });
}

// POST /api/locations - Create location in the caller's business
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const input = locationInput.parse(await request.json());

    return prisma.location.create({
      data: {
        name: input.name,
        address: input.address,
        address2: input.address2 ?? null,
        city: input.city,
        state: input.state,
        zip: input.zip,
        country: input.country || "USA",
        phone: input.phone ?? null,
        email: input.email || null,
        operatingHours: (input.operatingHours ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        businessId: ctx.businessId,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        allowOnlineBooking: input.allowOnlineBooking ?? true,
        bookingUrl: input.bookingUrl ?? null,
        advanceBookingDays: input.advanceBookingDays ?? 30,
        cancellationHours: input.cancellationHours ?? 24,
        isActive: true,
      },
    });
  });
}
