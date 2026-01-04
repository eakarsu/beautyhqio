import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/loyalty - Get loyalty program
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    let program;
    if (businessId) {
      program = await prisma.loyaltyProgram.findUnique({
        where: { businessId },
        include: {
          rewards: {
            where: { isActive: true },
            orderBy: { pointsCost: "asc" },
          },
          accounts: {
            include: {
              client: true,
            },
            orderBy: {
              lifetimePoints: "desc",
            },
            take: 100,
          },
        },
      });
    } else {
      // If no businessId, return the first loyalty program
      program = await prisma.loyaltyProgram.findFirst({
        include: {
          rewards: {
            where: { isActive: true },
            orderBy: { pointsCost: "asc" },
          },
          accounts: {
            include: {
              client: true,
            },
            orderBy: {
              lifetimePoints: "desc",
            },
            take: 100,
          },
        },
      });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("Error fetching loyalty program:", error);
    return NextResponse.json(
      { error: "Failed to fetch loyalty program" },
      { status: 500 }
    );
  }
}

// PUT /api/loyalty - Update loyalty program
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, ...data } = body;

    const program = await prisma.loyaltyProgram.update({
      where: { businessId },
      data,
      include: {
        rewards: true,
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error("Error updating loyalty program:", error);
    return NextResponse.json(
      { error: "Failed to update loyalty program" },
      { status: 500 }
    );
  }
}
