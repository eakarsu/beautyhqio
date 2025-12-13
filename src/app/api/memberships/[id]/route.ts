import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/memberships/[id] - Get membership plan details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { status: "active" },
          orderBy: { startDate: "desc" },
          take: 10,
        },
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...membership,
      price: Number(membership.price),
      discountPercent: Number(membership.discountPercent),
      subscriptions: membership.subscriptions.map((s) => ({
        ...s,
        lastPaymentAmount: s.lastPaymentAmount
          ? Number(s.lastPaymentAmount)
          : null,
      })),
      totalSubscribers: membership._count.subscriptions,
    });
  } catch (error) {
    console.error("Error fetching membership:", error);
    return NextResponse.json(
      { error: "Failed to fetch membership" },
      { status: 500 }
    );
  }
}

// PUT /api/memberships/[id] - Update membership plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const membership = await prisma.membership.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      ...membership,
      price: Number(membership.price),
      discountPercent: Number(membership.discountPercent),
    });
  } catch (error) {
    console.error("Error updating membership:", error);
    return NextResponse.json(
      { error: "Failed to update membership" },
      { status: 500 }
    );
  }
}

// DELETE /api/memberships/[id] - Deactivate membership plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.membership.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting membership:", error);
    return NextResponse.json(
      { error: "Failed to delete membership" },
      { status: 500 }
    );
  }
}
