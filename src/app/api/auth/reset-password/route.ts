import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { passwordSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const { token, email, newPassword } = await request.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: "Token, email, and new password are required" },
        { status: 400 }
      );
    }

    if (!passwordSchema.safeParse(newPassword).success) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check token expiry
    if (new Date() > user.resetTokenExpiry) {
      // Clear expired token
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null },
      });
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify token
    const suppliedHash = crypto.createHash("sha256").update(String(token)).digest();
    const storedHash = Buffer.from(user.resetToken, "hex");
    const isValidToken = storedHash.length === suppliedHash.length && crypto.timingSafeEqual(storedHash, suppliedHash);
    if (!isValidToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    await prisma.mobileSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await prisma.auditLog.create({ data: { userId: user.id, businessId: user.businessId, action: "PASSWORD_RESET", entityType: "User", entityId: user.id } });

    return NextResponse.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
