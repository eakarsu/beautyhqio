import { publicUserSelect } from "@/lib/public-user";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

// Allowlist of staff fields a manager may change. Identity (userId), tenant
// placement (locationId) and integration credentials are excluded.
const updateStaffSchema = z.object({
  displayName: z.string().trim().max(150).optional().nullable(),
  title: z.string().trim().max(150).optional().nullable(),
  bio: z.string().trim().max(4000).optional().nullable(),
  color: z.string().trim().max(40).optional().nullable(),
  photo: z.string().trim().max(2000).optional().nullable(),
  specialties: z.array(z.string().trim().max(100)).max(100).optional(),
  serviceIds: z.array(z.string().trim().max(191)).max(500).optional(),
  employmentType: z.enum(["EMPLOYEE", "BOOTH_RENTER", "CONTRACTOR"]).optional(),
  hireDate: z.string().datetime().optional().nullable(),
  payType: z.enum(["HOURLY", "COMMISSION", "SALARY", "HYBRID"]).optional().nullable(),
  hourlyRate: z.coerce.number().finite().min(0).max(1_000_000).optional().nullable(),
  commissionPct: z.coerce.number().finite().min(0).max(100).optional().nullable(),
  productCommissionPct: z.coerce.number().finite().min(0).max(100).optional().nullable(),
  boothRent: z.coerce.number().finite().min(0).max(1_000_000).optional().nullable(),
  rentFrequency: z.string().trim().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
  acceptsWalkIns: z.boolean().optional(),
  isBookableOnline: z.boolean().optional(),
  workingHours: z.any().optional(),
  payoutMethod: z.string().trim().max(50).optional().nullable(),
  bankAccountHolder: z.string().trim().max(150).optional().nullable(),
  bankName: z.string().trim().max(150).optional().nullable(),
  bankAccountLast4: z.string().trim().max(4).optional().nullable(),
  bankAccountType: z.string().trim().max(30).optional().nullable(),
});

// GET /api/staff/[id] - Get staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    const staff = await prisma.staff.findFirst({
      where: { id, location: { businessId: ctx.businessId } },
      include: {
        user: { select: publicUserSelect },
        location: true,
        schedules: true,
        timeOff: {
          where: {
            endDate: {
              gte: new Date(),
            },
          },
        },
        appointments: {
          take: 10,
          orderBy: {
            scheduledStart: "desc",
          },
          include: {
            client: true,
            services: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (!staff) fail(404, "Staff not found");

    return staff;
  });
}

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;
    const body = updateStaffSchema.parse(await request.json());

    const owned = await prisma.staff.findFirst({
      where: { id, location: { businessId: ctx.businessId } },
      select: { id: true },
    });
    if (!owned) fail(404, "Staff not found");

    const data = {
      ...body,
      ...(body.hireDate !== undefined
        ? { hireDate: body.hireDate ? new Date(body.hireDate) : null }
        : {}),
    };

    return prisma.staff.update({
      where: { id },
      data,
      include: {
        user: { select: publicUserSelect },
        location: true,
      },
    });
  });
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;

    const owned = await prisma.staff.findFirst({
      where: { id, location: { businessId: ctx.businessId } },
      select: { id: true },
    });
    if (!owned) fail(404, "Staff not found");

    // Delete related records first
    await prisma.staffSchedule.deleteMany({ where: { staffId: id } });
    await prisma.timeOff.deleteMany({ where: { staffId: id } });

    // Delete the staff member
    await prisma.staff.delete({
      where: { id },
    });

    return { success: true };
  });
}
