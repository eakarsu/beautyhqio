import { context, endpoint, fail } from "@/lib/operations/core";
import { prisma } from "@/lib/prisma";

// GET /api/business - the authenticated user's own business.
// Previously returned every tenant's row to anonymous callers; now scoped by
// the caller's businessId, and a platform admin must enter through a business.
export async function GET() {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const business = await prisma.business.findFirst({
      where: { id: ctx.businessId },
    });
    return business || fail(404, "Business not found");
  });
}
