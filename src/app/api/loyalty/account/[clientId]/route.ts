import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

// GET /api/loyalty/account/[clientId] - Get loyalty account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "CLIENT"]);
    const { clientId } = await params;

    // A signed-in client may only read their own loyalty account.
    if (ctx.user.role === "CLIENT" && clientId !== ctx.user.clientId) {
      return fail(403, "You can only view your own loyalty account");
    }

    const account = await prisma.loyaltyAccount.findFirst({
      where: { clientId, client: { businessId: ctx.businessId } },
      include: {
        client: true,
        program: {
          include: {
            rewards: true,
          },
        },
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
    });

    return account || fail(404, "Loyalty account not found");
  });
}
