import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rotateMobileSession } from "@/lib/mobile-session";

const schema = z.object({ refreshToken: z.string().min(50).max(100) });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 422 });
  const credentials = await rotateMobileSession(prisma, parsed.data.refreshToken);
  if (!credentials) return NextResponse.json({ error: "INVALID_REFRESH_TOKEN" }, { status: 401 });
  return NextResponse.json(credentials);
}
