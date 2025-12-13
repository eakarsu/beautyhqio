import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/services/[id]/addons - Get all add-ons for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const addOns = await prisma.serviceAddOn.findMany({
      where: { serviceId: id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(addOns);
  } catch (error) {
    console.error("Error fetching add-ons:", error);
    return NextResponse.json(
      { error: "Failed to fetch add-ons" },
      { status: 500 }
    );
  }
}

// POST /api/services/[id]/addons - Create a new add-on
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const addOn = await prisma.serviceAddOn.create({
      data: {
        serviceId: id,
        name: body.name,
        price: body.price,
        duration: body.duration || 0,
      },
    });

    return NextResponse.json(addOn, { status: 201 });
  } catch (error) {
    console.error("Error creating add-on:", error);
    return NextResponse.json(
      { error: "Failed to create add-on" },
      { status: 500 }
    );
  }
}
