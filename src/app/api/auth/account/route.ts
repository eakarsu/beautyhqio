import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
}

// DELETE /api/auth/account - Delete user account and all associated data
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        staff: true,
        client: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (user.client) {
        const clientId = user.client.id;
        await tx.appointment.deleteMany({ where: { clientId } });
        await tx.transaction.deleteMany({ where: { clientId } });
        await tx.clientNote.deleteMany({ where: { clientId } });
        await tx.loyaltyAccount.deleteMany({ where: { clientId } });
        await tx.client.delete({ where: { id: clientId } });
      }

      if (user.staff) {
        const staffId = user.staff.id;
        // Appointment.staffId is required, so we delete the staff's appointments
        await tx.appointment.deleteMany({ where: { staffId } });
        await tx.staff.delete({ where: { id: staffId } });
      }

      await tx.account.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again or contact support." },
      { status: 500 }
    );
  }
}
