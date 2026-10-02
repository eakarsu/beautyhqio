import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

// GET /api/products/[id]/transactions - Get product transaction history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    const product = await prisma.product.findFirst({ where: { id, businessId: ctx.businessId }, select: { id: true } });
    if (!product) return fail(404, "Product not found");

    return prisma.transactionLineItem.findMany({
      where: {
        productId: id,
        transaction: { location: { businessId: ctx.businessId } },
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
  });
}
