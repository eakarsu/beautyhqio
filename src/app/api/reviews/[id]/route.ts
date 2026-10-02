import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

// GET /api/reviews/[id] - Get review details. Client-facing: a CLIENT can only
// read their own review.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF", "CLIENT"]);
    const { id } = await params;

    const review = await prisma.review.findFirst({
      where:
        ctx.user.role === "CLIENT"
          ? { id, clientId: ctx.user.clientId || "__none__" }
          : { id, client: { businessId: ctx.businessId } },
      include: {
        client: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!review) fail(404, "Review not found");

    return review;
  });
}

// PUT /api/reviews/[id] - Update review (approve, respond, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const body = z
      .object({
        rating: z.coerce.number().int().min(1).max(5).optional(),
        comment: z.string().max(5000).optional().nullable(),
        source: z.string().trim().max(100).optional(),
        isPublic: z.boolean().optional(),
        response: z.string().max(5000).optional().nullable(),
        respondedAt: z.coerce.date().optional().nullable(),
      })
      .parse(await request.json());

    const existing = await prisma.review.findFirst({
      where: { id, client: { businessId: ctx.businessId } },
      select: { id: true },
    });
    if (!existing) fail(404, "Review not found");

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...body,
        ...(body.response !== undefined &&
          body.respondedAt === undefined && { respondedAt: new Date() }),
      },
    });

    return review;
  });
}

// DELETE /api/reviews/[id] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;

    const result = await prisma.review.deleteMany({
      where: { id, client: { businessId: ctx.businessId } },
    });
    if (!result.count) fail(404, "Review not found");

    return { success: true };
  });
}
