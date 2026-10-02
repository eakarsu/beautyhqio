import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

const updatePhotoSchema = z.object({
  caption: z.string().trim().max(2000).optional().nullable(),
  isPortfolio: z.boolean().optional(),
  type: z.enum(["BEFORE", "AFTER", "INSPIRATION", "RESULT"]).optional(),
});

// A photo is only reachable when it belongs to the given client AND that
// client belongs to the caller's business.
async function findOwnedPhoto(
  businessId: string,
  clientId: string,
  photoId: string
) {
  const photo = await prisma.clientPhoto.findFirst({
    where: { id: photoId, clientId, client: { businessId } },
    select: { id: true },
  });
  if (!photo) fail(404, "Photo not found");
  return photo;
}

// GET /api/clients/[id]/photos/[photoId] - Get single photo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id, photoId } = await params;

    await findOwnedPhoto(ctx.businessId, id, photoId);

    const photo = await prisma.clientPhoto.findFirst({
      where: {
        id: photoId,
        clientId: id,
        client: { businessId: ctx.businessId },
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        appointment: {
          select: {
            scheduledStart: true,
            services: {
              include: {
                service: { select: { name: true } },
              },
            },
            staff: {
              select: { displayName: true },
            },
          },
        },
      },
    });

    return photo || fail(404, "Photo not found");
  });
}

// PATCH /api/clients/[id]/photos/[photoId] - Update photo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id, photoId } = await params;
    const { caption, isPortfolio, type } = updatePhotoSchema.parse(
      await request.json()
    );

    await findOwnedPhoto(ctx.businessId, id, photoId);

    const updateData: Record<string, unknown> = {};
    if (caption !== undefined) updateData.caption = caption;
    if (isPortfolio !== undefined) updateData.isPortfolio = isPortfolio;
    if (type !== undefined) updateData.type = type;

    return prisma.clientPhoto.update({
      where: { id: photoId },
      data: updateData,
    });
  });
}

// DELETE /api/clients/[id]/photos/[photoId] - Delete photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id, photoId } = await params;

    await findOwnedPhoto(ctx.businessId, id, photoId);

    await prisma.clientPhoto.delete({ where: { id: photoId } });

    return { success: true };
  });
}
