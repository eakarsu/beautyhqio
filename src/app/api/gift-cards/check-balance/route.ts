import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

// GET /api/gift-cards/check-balance?code=XXX - Check gift card balance
//
// A gift card balance is tenant data. This route requires a signed-in user and is
// scoped to the caller's business so one tenant can never enumerate another tenant's
// cards. There is deliberately no anonymous "code only" mode: that would let anyone
// walk the code space and read balances across businesses. A CLIENT may only see a
// card they own or purchased, and receives a minimal payload (no recipient identity).
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF", "CLIENT"]);

    const code = new URL(request.url).searchParams.get("code");
    if (!code) return fail(400, "Code is required");

    const giftCard = await prisma.giftCard.findFirst({
      where: {
        code,
        businessId: ctx.businessId,
        ...(ctx.user.role === "CLIENT"
          ? { OR: [{ ownerId: ctx.user.clientId || "__none__" }, { purchasedById: ctx.user.clientId || "__none__" }] }
          : {}),
      },
      select: {
        initialBalance: true,
        currentBalance: true,
        status: true,
        expiresAt: true,
        recipientName: true,
        recipientEmail: true,
        purchasedAt: true,
      },
    });

    if (!giftCard) return fail(404, "Gift card not found");

    if (ctx.user.role === "CLIENT") {
      // Minimal payload for clients: balance only, never recipient/client identity.
      return { currentBalance: giftCard.currentBalance, status: giftCard.status, expiresAt: giftCard.expiresAt };
    }

    return giftCard;
  });
}
