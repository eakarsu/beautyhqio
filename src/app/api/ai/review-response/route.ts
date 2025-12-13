import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouter } from "@/lib/openrouter";

// POST /api/ai/review-response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reviewId,
      rating,
      reviewText,
      clientName,
      service,
      staffMember,
      businessName = "Beauty & Wellness Salon",
    } = body;

    // If reviewId is provided, fetch from database
    if (reviewId) {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          client: true,
        },
      });

      if (!review) {
        return NextResponse.json(
          { error: "Review not found" },
          { status: 404 }
        );
      }

      const response = await openRouter.generateReviewResponse({
        clientName: `${review.client.firstName} ${review.client.lastName}`,
        rating: review.rating,
        reviewText: review.comment || "",
        service: undefined,
        staffMember: undefined,
        businessName,
      });

      return NextResponse.json({
        success: true,
        response,
        reviewInfo: {
          id: review.id,
          rating: review.rating,
          client: `${review.client.firstName} ${review.client.lastName}`,
        },
      });
    }

    // Manual review response generation
    if (!rating || !reviewText) {
      return NextResponse.json(
        { error: "rating and reviewText are required (or provide reviewId)" },
        { status: 400 }
      );
    }

    const response = await openRouter.generateReviewResponse({
      clientName: clientName || "Valued Customer",
      rating,
      reviewText,
      service,
      staffMember,
      businessName,
    });

    return NextResponse.json({
      success: true,
      response,
      metadata: {
        rating,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Review response generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate review response" },
      { status: 500 }
    );
  }
}
