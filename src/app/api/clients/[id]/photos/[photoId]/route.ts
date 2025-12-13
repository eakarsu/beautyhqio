import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clients/[id]/photos/[photoId] - Get single photo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id, photoId } = await params;

    const photo = await prisma.clientPhoto.findFirst({
      where: {
        id: photoId,
        clientId: id,
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

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Error fetching photo:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[id]/photos/[photoId] - Update photo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id, photoId } = await params;
    const body = await request.json();
    const { caption, isPortfolio, type } = body;

    const updateData: Record<string, unknown> = {};
    if (caption !== undefined) updateData.caption = caption;
    if (isPortfolio !== undefined) updateData.isPortfolio = isPortfolio;
    if (type !== undefined) updateData.type = type;

    const photo = await prisma.clientPhoto.update({
      where: {
        id: photoId,
        clientId: id,
      },
      data: updateData,
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json(
      { error: "Failed to update photo" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/photos/[photoId] - Delete photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id, photoId } = await params;

    await prisma.clientPhoto.delete({
      where: {
        id: photoId,
        clientId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
