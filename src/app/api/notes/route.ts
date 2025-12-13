import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const pinnedOnly = searchParams.get("pinned") === "true";

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const notes = await prisma.clientNote.findMany({
      where: {
        clientId,
        ...(pinnedOnly && { isPinned: true }),
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, userId, content, isPrivate, isPinned } = body;

    if (!clientId || !content) {
      return NextResponse.json(
        { error: "clientId and content are required" },
        { status: 400 }
      );
    }

    const note = await prisma.clientNote.create({
      data: {
        clientId,
        createdById: userId || "",
        content,
        isPrivate: isPrivate || false,
        isPinned: isPinned || false,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        clientId,
        userId,
        type: "NOTE_ADDED",
        title: "Note added",
        description: content.substring(0, 100),
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
