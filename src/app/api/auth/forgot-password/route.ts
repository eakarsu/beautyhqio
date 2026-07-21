import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { enforceLoginRateLimit } from "@/lib/mobile-session";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const identityHash = await enforceLoginRateLimit(prisma, `reset:${request.headers.get("x-forwarded-for") || "unknown"}:${normalizedEmail}`).catch(() => null);
    if (!identityHash) return NextResponse.json({ message: "If an account exists with that email, a reset link has been sent." });
    await prisma.loginAttempt.create({ data: { identityHash, succeeded: false } });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with that email, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("base64url");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl) throw new Error("NEXTAUTH_URL is required");
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    const delivery = await sendEmail({
      to: normalizedEmail,
      subject: "Password Reset Request",
      html: `
            <h2>Password Reset</h2>
            <p>You requested a password reset for your account.</p>
            <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#e11d48;color:white;text-decoration:none;border-radius:8px;">Reset Password</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `,
    });
    if (!delivery.success) {
      await prisma.user.update({ where: { id: user.id }, data: { resetToken: null, resetTokenExpiry: null } });
    }

    return NextResponse.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
