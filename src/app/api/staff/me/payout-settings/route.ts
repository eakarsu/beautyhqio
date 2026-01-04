import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/staff/me/payout-settings - Get payout settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      select: {
        payoutMethod: true,
        bankAccountHolder: true,
        bankName: true,
        bankAccountLast4: true,
        bankAccountType: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({
      payoutMethod: staff.payoutMethod || "manual",
      bankAccount: staff.bankAccountLast4
        ? {
            holderName: staff.bankAccountHolder,
            bankName: staff.bankName,
            last4: staff.bankAccountLast4,
            accountType: staff.bankAccountType,
          }
        : null,
      stripeConnected: !!staff.stripeAccountId && staff.stripeAccountStatus === "active",
    });
  } catch (error) {
    console.error("Error fetching payout settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/staff/me/payout-settings - Update payout settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      payoutMethod,
      bankAccountHolder,
      bankName,
      bankRoutingNumber,
      bankAccountNumber,
      bankAccountType,
    } = body;

    const staff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (payoutMethod) {
      updateData.payoutMethod = payoutMethod;
    }

    // If bank details provided, update them
    if (bankAccountNumber) {
      // Store last 4 digits for display
      updateData.bankAccountLast4 = bankAccountNumber.slice(-4);
      updateData.bankAccountNumber = bankAccountNumber; // In production, encrypt this
      updateData.bankRoutingNumber = bankRoutingNumber;
      updateData.bankAccountHolder = bankAccountHolder;
      updateData.bankName = bankName;
      updateData.bankAccountType = bankAccountType || "checking";
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: staff.id },
      data: updateData,
      select: {
        payoutMethod: true,
        bankAccountHolder: true,
        bankName: true,
        bankAccountLast4: true,
        bankAccountType: true,
      },
    });

    return NextResponse.json({
      success: true,
      payoutMethod: updatedStaff.payoutMethod,
      bankAccount: updatedStaff.bankAccountLast4
        ? {
            holderName: updatedStaff.bankAccountHolder,
            bankName: updatedStaff.bankName,
            last4: updatedStaff.bankAccountLast4,
            accountType: updatedStaff.bankAccountType,
          }
        : null,
    });
  } catch (error) {
    console.error("Error updating payout settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/me/payout-settings - Remove bank account
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.staff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        bankAccountHolder: null,
        bankName: null,
        bankAccountLast4: null,
        bankRoutingNumber: null,
        bankAccountNumber: null,
        bankAccountType: null,
        payoutMethod: staff.stripeAccountId ? "stripe_connect" : "manual",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing bank account:", error);
    return NextResponse.json(
      { error: "Failed to remove bank account" },
      { status: 500 }
    );
  }
}
