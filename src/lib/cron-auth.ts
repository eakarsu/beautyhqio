import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (expected.length < 32 || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}
