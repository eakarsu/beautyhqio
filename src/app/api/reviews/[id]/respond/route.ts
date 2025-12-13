import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/reviews/[id]/respond - Add business response to review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { response } = body;

    const review = await prisma.review.update({
      where: { id },
      data: {
        response,
        respondedAt: new Date(),
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Create activity for client about response
    if (review.clientId) {
      await prisma.activity.create({
        data: {
          clientId: review.clientId,
          type: "REVIEW_RECEIVED",
          title: "Business responded to your review",
          description: response.substring(0, 100),
          metadata: { reviewId: id },
        },
      });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error responding to review:", error);
    return NextResponse.json(
      { error: "Failed to respond to review" },
      { status: 500 }
    );
  }
}
