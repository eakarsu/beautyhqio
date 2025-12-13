import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const fileType = searchParams.get("fileType");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        clientId,
        ...(fileType && { fileType }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, userId, fileName, fileType, fileSize, filePath, description } = body;

    if (!clientId || !fileName || !filePath) {
      return NextResponse.json(
        { error: "clientId, fileName, and filePath are required" },
        { status: 400 }
      );
    }

    const attachment = await prisma.attachment.create({
      data: {
        clientId,
        uploadedById: userId || "",
        fileName,
        fileType: fileType || "application/octet-stream",
        fileSize: fileSize || 0,
        filePath,
        description,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        clientId,
        userId,
        type: "NOTE_ADDED",
        title: "File uploaded",
        description: fileName,
      },
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("Error creating attachment:", error);
    return NextResponse.json(
      { error: "Failed to create attachment" },
      { status: 500 }
    );
  }
}
