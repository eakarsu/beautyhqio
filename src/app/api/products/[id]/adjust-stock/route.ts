import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/products/[id]/adjust-stock - Adjust inventory
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adjustment, reason } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        quantityOnHand: {
          increment: adjustment,
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
