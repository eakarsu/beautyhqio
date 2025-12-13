import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/loyalty/rewards - List rewards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");

    const where: any = { isActive: true };
    if (programId) where.programId = programId;

    const rewards = await prisma.loyaltyReward.findMany({
      where,
      orderBy: { pointsCost: "asc" },
    });

    return NextResponse.json(rewards);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}

// POST /api/loyalty/rewards - Create reward
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { programId, name, description, pointsCost, type, value } = body;

    if (!programId || !name || !pointsCost) {
      return NextResponse.json(
        { error: "Program ID, name, and points cost are required" },
        { status: 400 }
      );
    }

    const reward = await prisma.loyaltyReward.create({
      data: {
        programId,
        name,
        description: description || null,
        pointsCost: parseInt(String(pointsCost)),
        type: type || "CUSTOM",
        value: value !== null && value !== undefined ? value : 0,
        isActive: true,
      },
    });

    return NextResponse.json(reward, { status: 201 });
  } catch (error) {
    console.error("Error creating reward:", error);
    return NextResponse.json(
      { error: "Failed to create reward" },
      { status: 500 }
    );
  }
}
