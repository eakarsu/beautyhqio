import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/automations - List automations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const triggerType = searchParams.get("triggerType");
    const businessId = searchParams.get("businessId");

    const where: Record<string, unknown> = {};
    if (isActive !== null) where.isActive = isActive === "true";
    if (triggerType) where.triggerType = triggerType;
    if (businessId) where.businessId = businessId;

    const automations = await prisma.automation.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Error fetching automations:", error);
    return NextResponse.json(
      { error: "Failed to fetch automations" },
      { status: 500 }
    );
  }
}

// POST /api/automations - Create automation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      triggerType,
      triggerConfig,
      actions,
      isActive = true,
      businessId,
    } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    if (!triggerType) {
      return NextResponse.json(
        { error: "triggerType is required" },
        { status: 400 }
      );
    }

    if (!actions) {
      return NextResponse.json(
        { error: "actions is required" },
        { status: 400 }
      );
    }

    const automation = await prisma.automation.create({
      data: {
        name,
        description,
        triggerType,
        triggerConfig,
        actions,
        isActive,
        businessId,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error("Error creating automation:", error);
    return NextResponse.json(
      { error: "Failed to create automation" },
      { status: 500 }
    );
  }
}
