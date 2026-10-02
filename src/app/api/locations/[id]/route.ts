import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const optionalText = z.string().trim().max(500).optional().nullable();

const updateLocationSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  phone: optionalText,
  email: z.union([z.string().email().max(200), z.literal("")]).optional().nullable(),
  address: z.string().trim().max(300).optional(),
  address2: optionalText,
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  zip: z.string().trim().max(20).optional(),
  country: z.string().trim().max(120).optional(),
  latitude: z.coerce.number().finite().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().finite().min(-180).max(180).optional().nullable(),
  operatingHours: z.any().optional().nullable(),
  allowOnlineBooking: z.boolean().optional(),
  bookingUrl: optionalText,
  advanceBookingDays: z.coerce.number().int().min(1).max(365).optional(),
  cancellationHours: z.coerce.number().int().min(0).max(720).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/locations/[id] - Get location details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    const location = await prisma.location.findFirst({
      where: { id, businessId: ctx.businessId },
      include: {
        _count: {
          select: {
            staff: true,
            appointments: true,
            transactions: true,
            waitlist: true,
          },
        },
      },
    });

    return location || fail(404, "Location not found");
  });
}

// PUT /api/locations/[id] - Update location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;
    const input = updateLocationSchema.parse(await request.json());

    const existing = await prisma.location.findFirst({ where: { id, businessId: ctx.businessId }, select: { id: true } });
    if (!existing) return fail(404, "Location not found");

    return prisma.location.update({ where: { id }, data: input });
  });
}

// DELETE /api/locations/[id] - Delete location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;

    const existing = await prisma.location.findFirst({ where: { id, businessId: ctx.businessId }, select: { id: true } });
    if (!existing) return fail(404, "Location not found");

    // Soft delete - just deactivate
    await prisma.location.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  });
}
