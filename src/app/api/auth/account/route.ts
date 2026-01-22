import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// DELETE /api/auth/account - Delete user account and all associated data
export async function DELETE(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Find user to ensure they exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        staff: true,
        clients: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete user and all associated data
    // Prisma will handle cascading deletes based on schema relations
    await prisma.$transaction(async (tx) => {
      // Delete client records if user has any
      if (user.clients && user.clients.length > 0) {
        for (const client of user.clients) {
          // Delete client appointments
          await tx.appointment.deleteMany({
            where: { clientId: client.id },
          });

          // Delete client transactions
          await tx.transaction.deleteMany({
            where: { clientId: client.id },
          });

          // Delete client notes
          await tx.clientNote.deleteMany({
            where: { clientId: client.id },
          });

          // Delete client loyalty accounts
          await tx.loyaltyAccount.deleteMany({
            where: { clientId: client.id },
          });

          // Delete the client record
          await tx.client.delete({
            where: { id: client.id },
          });
        }
      }

      // Delete staff record if user is staff
      if (user.staff) {
        // Update appointments to remove staff reference
        await tx.appointment.updateMany({
          where: { staffId: user.staff.id },
          data: { staffId: null as any },
        });

        await tx.staff.delete({
          where: { id: user.staff.id },
        });
      }

      // Delete user sessions/accounts (NextAuth related)
      await tx.account.deleteMany({
        where: { userId: user.id },
      });

      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    return NextResponse.json({
      message: "Account deleted successfully",
    });
  } catch (error: any) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again or contact support." },
      { status: 500 }
    );
  }
}
