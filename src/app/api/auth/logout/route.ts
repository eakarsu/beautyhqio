import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revokeMobileSession } from "@/lib/mobile-session";

const schema = z.object({ refreshToken: z.string().min(50).max(100) });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (parsed.success) await revokeMobileSession(prisma, parsed.data.refreshToken);
  return NextResponse.json({ message: "Logged out successfully" });
}
