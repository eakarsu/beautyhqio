import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

// GET /api/reviews - List reviews. Client-facing: a CLIENT only sees their own
// reviews; staff see every review for the business.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF", "CLIENT"]);
    const { searchParams } = new URL(request.url);
    const minRatingParam = searchParams.get("minRating");
    const limit = z.coerce.number().int().min(1).max(200).parse(searchParams.get("limit") || 50);
    const minRating = minRatingParam
      ? z.coerce.number().int().min(1).max(5).parse(minRatingParam)
      : undefined;

    const where: Prisma.ReviewWhereInput = {
      ...(minRating && { rating: { gte: minRating } }),
      ...(ctx.user.role === "CLIENT"
        ? { clientId: ctx.user.clientId || "__none__" }
        : { client: { businessId: ctx.businessId } }),
    };

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

    return reviews;
  });
}

// POST /api/reviews - Create review (recorded by front-desk / management staff)
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const body = z
      .object({
        clientId: idSchema,
        rating: z.coerce.number().int().min(1).max(5),
        comment: z.string().max(5000).optional().nullable(),
        source: z.string().trim().max(100).optional(),
        isPublic: z.boolean().optional(),
      })
      .parse(await request.json());

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!client) fail(404, "Client not found");

    const review = await prisma.review.create({
      data: {
        clientId: body.clientId,
        rating: body.rating,
        comment: body.comment ?? null,
        source: body.source || "website",
        isPublic: body.isPublic ?? true,
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
        clientId: body.clientId,
        userId: ctx.user.id,
        type: "REVIEW_RECEIVED",
        title: `Left a ${body.rating}-star review`,
        description: body.comment?.substring(0, 100) || "No comment",
        metadata: { reviewId: review.id, rating: body.rating },
      },
    });

    return NextResponse.json(review, { status: 201 });
  });
}
