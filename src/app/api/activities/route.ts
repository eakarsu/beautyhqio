import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const activities = await prisma.activity.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(type && { type: type as ActivityType }),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.activity.count({
      where: {
        ...(clientId && { clientId }),
        ...(type && { type: type as ActivityType }),
      },
    });

    return NextResponse.json({
      activities,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, userId, type, title, description, metadata } = body;

    if (!clientId || !type || !title) {
      return NextResponse.json(
        { error: "clientId, type, and title are required" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        clientId,
        userId,
        type,
        title,
        description,
        metadata: metadata || {},
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
