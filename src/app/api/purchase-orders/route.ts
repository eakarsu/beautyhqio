import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Generate PO number
async function generatePONumber(): Promise<string> {
  const date = new Date();
  const prefix = `PO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;

  const lastPO = await prisma.purchaseOrder.findFirst({
    where: { poNumber: { startsWith: prefix } },
    orderBy: { poNumber: "desc" },
  });

  if (lastPO) {
    const lastNum = parseInt(lastPO.poNumber.split("-")[2]) || 0;
    return `${prefix}-${String(lastNum + 1).padStart(4, "0")}`;
  }

  return `${prefix}-0001`;
}

// GET /api/purchase-orders - List purchase orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: {
          select: { id: true, name: true },
        },
        items: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { orderDate: "desc" },
      take: limit,
    });

    return NextResponse.json(
      orders.map((po) => ({
        ...po,
        subtotal: Number(po.subtotal),
        taxAmount: Number(po.taxAmount),
        shippingAmount: Number(po.shippingAmount),
        totalAmount: Number(po.totalAmount),
        items: po.items.map((item) => ({
          ...item,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
        })),
        itemCount: po._count.items,
      }))
    );
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders - Create a new purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vendorId,
      createdById,
      expectedDate,
      items,
      taxAmount = 0,
      shippingAmount = 0,
      notes,
    } = body;

    if (!vendorId || !createdById || !items?.length) {
      return NextResponse.json(
        { error: "vendorId, createdById, and items are required" },
        { status: 400 }
      );
    }

    const poNumber = await generatePONumber();

    // Calculate subtotal
    const subtotal = items.reduce(
      (sum: number, item: { unitCost: number; quantityOrdered: number }) =>
        sum + item.unitCost * item.quantityOrdered,
      0
    );

    const totalAmount = subtotal + taxAmount + shippingAmount;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        createdById,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal,
        taxAmount,
        shippingAmount,
        totalAmount,
        notes,
        items: {
          create: items.map(
            (item: {
              productId: string;
              productName: string;
              sku?: string;
              quantityOrdered: number;
              unitCost: number;
            }) => ({
              productId: item.productId,
              productName: item.productName,
              sku: item.sku,
              quantityOrdered: item.quantityOrdered,
              unitCost: item.unitCost,
              totalCost: item.unitCost * item.quantityOrdered,
            })
          ),
        },
      },
      include: {
        vendor: {
          select: { name: true },
        },
        items: true,
      },
    });

    return NextResponse.json(
      {
        ...purchaseOrder,
        subtotal: Number(purchaseOrder.subtotal),
        taxAmount: Number(purchaseOrder.taxAmount),
        shippingAmount: Number(purchaseOrder.shippingAmount),
        totalAmount: Number(purchaseOrder.totalAmount),
        items: purchaseOrder.items.map((item) => ({
          ...item,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
