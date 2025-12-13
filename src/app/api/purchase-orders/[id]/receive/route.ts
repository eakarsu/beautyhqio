import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/purchase-orders/[id]/receive - Receive items from purchase order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items } = body;

    if (!items?.length) {
      return NextResponse.json(
        { error: "items array is required" },
        { status: 400 }
      );
    }

    // Get the purchase order
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot receive a cancelled order" },
        { status: 400 }
      );
    }

    // Update each item and product inventory
    const updatePromises = items.map(
      async (item: { itemId: string; quantityReceived: number }) => {
        const orderItem = order.items.find((i) => i.id === item.itemId);
        if (!orderItem) return null;

        // Update the order item
        await prisma.purchaseOrderItem.update({
          where: { id: item.itemId },
          data: {
            quantityReceived: {
              increment: item.quantityReceived,
            },
          },
        });

        // Update product inventory
        await prisma.product.update({
          where: { id: orderItem.productId },
          data: {
            quantityOnHand: {
              increment: item.quantityReceived,
            },
          },
        });

        return {
          itemId: item.itemId,
          productId: orderItem.productId,
          quantityReceived: item.quantityReceived,
        };
      }
    );

    const results = await Promise.all(updatePromises);

    // Get updated order to check status
    const updatedOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    // Determine new status
    let newStatus = order.status;
    if (updatedOrder) {
      const allReceived = updatedOrder.items.every(
        (item) => item.quantityReceived >= item.quantityOrdered
      );
      const someReceived = updatedOrder.items.some(
        (item) => item.quantityReceived > 0
      );

      if (allReceived) {
        newStatus = "received";
      } else if (someReceived) {
        newStatus = "partial";
      }

      // Update order status
      await prisma.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus,
          ...(allReceived && { receivedDate: new Date() }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      newStatus,
      receivedItems: results.filter(Boolean),
    });
  } catch (error) {
    console.error("Error receiving purchase order:", error);
    return NextResponse.json(
      { error: "Failed to receive purchase order" },
      { status: 500 }
    );
  }
}
