import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clients/[id]/photos - Get client photos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // BEFORE, AFTER, INSPIRATION, RESULT
    const portfolioOnly = searchParams.get("portfolio") === "true";

    const where: Record<string, unknown> = { clientId: id };

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

    return NextResponse.json({
      photos,
      beforeAfterPairs: Object.values(byAppointment).filter(
        (pair) => pair.before.length > 0 || pair.after.length > 0
      ),
      portfolioPhotos: photos.filter((p) => p.isPortfolio),
      totalCount: photos.length,
    });
  } catch (error) {
    console.error("Error fetching client photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/photos - Add photo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      type = "AFTER",
      filePath,
      caption,
      serviceDate,
      appointmentId,
      isPortfolio = false,
    } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: "filePath is required" },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
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

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error adding photo:", error);
    return NextResponse.json({ error: "Failed to add photo" }, { status: 500 });
  }
}
