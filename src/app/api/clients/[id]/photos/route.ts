import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const photoType = z.enum(["BEFORE", "AFTER", "INSPIRATION", "RESULT"]);

const createPhotoSchema = z.object({
  type: photoType.default("AFTER"),
  filePath: z.string().trim().min(1).max(2000),
  caption: z.string().trim().max(2000).optional().nullable(),
  serviceDate: z.string().datetime().optional().nullable(),
  appointmentId: idSchema.optional().nullable(),
  isPortfolio: z.boolean().default(false),
});

// GET /api/clients/[id]/photos - Get client photos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = photoType.optional().parse(searchParams.get("type") || undefined);
    const portfolioOnly = searchParams.get("portfolio") === "true";

    const client = await prisma.client.findFirst({
      where: { id, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!client) fail(404, "Client not found");

    const where: Record<string, unknown> = {
      clientId: id,
      client: { businessId: ctx.businessId },
    };

    if (type) {
      where.type = type;
    }

    if (portfolioOnly) {
      where.isPortfolio = true;
    }

    const photos = await prisma.clientPhoto.findMany({
      where,
      include: {
        appointment: {
          select: {
            id: true,
            scheduledStart: true,
            services: {
              include: {
                service: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { takenAt: "desc" },
    });

    // Group by appointment for before/after pairs
    const byAppointment: Record<
      string,
      {
        appointmentId: string;
        date: Date;
        services: string[];
        before: typeof photos;
        after: typeof photos;
      }
    > = {};

    photos.forEach((photo) => {
      if (photo.appointmentId) {
        if (!byAppointment[photo.appointmentId]) {
          byAppointment[photo.appointmentId] = {
            appointmentId: photo.appointmentId,
            date: photo.appointment?.scheduledStart || photo.takenAt,
            services:
              photo.appointment?.services.map((s) => s.service.name) || [],
            before: [],
            after: [],
          };
        }
        if (photo.type === "BEFORE") {
          byAppointment[photo.appointmentId].before.push(photo);
        } else if (photo.type === "AFTER" || photo.type === "RESULT") {
          byAppointment[photo.appointmentId].after.push(photo);
        }
      }
    });

    return {
      photos,
      beforeAfterPairs: Object.values(byAppointment).filter(
        (pair) => pair.before.length > 0 || pair.after.length > 0
      ),
      portfolioPhotos: photos.filter((p) => p.isPortfolio),
      totalCount: photos.length,
    };
  });
}

// POST /api/clients/[id]/photos - Add photo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;
    const {
      type,
      filePath,
      caption,
      serviceDate,
      appointmentId,
      isPortfolio,
    } = createPhotoSchema.parse(await request.json());

    const client = await prisma.client.findFirst({
      where: { id, businessId: ctx.businessId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!client) fail(404, "Client not found");

    if (appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, clientId: id, businessId: ctx.businessId },
        select: { id: true },
      });
      if (!appointment) fail(422, "Appointment not found for this client");
    }

    const photo = await prisma.clientPhoto.create({
      data: {
        clientId: id,
        type,
        filePath,
        caption,
        serviceDate: serviceDate ? new Date(serviceDate) : null,
        appointmentId,
        isPortfolio,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        clientId: id,
        type: "PHOTO_ADDED",
        title: `${type.toLowerCase()} photo added`,
        description: caption || `New ${type.toLowerCase()} photo uploaded`,
        metadata: { photoId: photo.id, photoType: type },
      },
    });

    return photo;
  });
}
