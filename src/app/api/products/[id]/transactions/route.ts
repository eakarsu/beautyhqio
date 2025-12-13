import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products/[id]/transactions - Get product transaction history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transactions = await prisma.transactionLineItem.findMany({
      where: {
        productId: id,
      },
      include: {
        transaction: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        transaction: {
          createdAt: "desc",
        },
      },
      take: 50,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching product transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch product transactions" },
      { status: 500 }
    );
  }
}
