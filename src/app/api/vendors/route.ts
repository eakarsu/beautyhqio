import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vendors - List all vendors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (activeOnly) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      vendors.map((v) => ({
        ...v,
        orderCount: v._count.purchaseOrders,
      }))
    );
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Create a new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      name,
      contactName,
      email,
      phone,
      website,
      address,
      city,
      state,
      zip,
      country,
      paymentTerms,
      accountNumber,
      notes,
    } = body;

    if (!businessId || !name) {
      return NextResponse.json(
        { error: "businessId and name are required" },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.create({
      data: {
        businessId,
        name,
        contactName,
        email,
        phone,
        website,
        address,
        city,
        state,
        zip,
        country,
        paymentTerms,
        accountNumber,
        notes,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}
