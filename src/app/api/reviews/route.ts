import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reviews - List reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minRating = searchParams.get("minRating");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (minRating) where.rating = { gte: parseInt(minRating) };

    const reviews = await prisma.review.findMany({
      where,
      include: {
        client: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      rating,
      comment,
      source,
      isPublic = true,
    } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        clientId,
        rating,
        comment,
        source: source || "website",
        isPublic,
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Create activity for client
    await prisma.activity.create({
      data: {
        clientId,
        type: "REVIEW_RECEIVED",
        title: `Left a ${rating}-star review`,
        description: comment?.substring(0, 100) || "No comment",
        metadata: { reviewId: review.id, rating },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
