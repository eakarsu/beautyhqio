import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const earnPointsSchema = z.object({
  clientId: idSchema,
  points: z.coerce.number().int().min(-1_000_000).max(1_000_000),
  description: z.string().trim().max(500).optional().nullable(),
  type: z.string().trim().max(40).default("earn"),
});

// POST /api/loyalty/earn - Award points
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "CLIENT"]);
    const input = earnPointsSchema.parse(await request.json());

    // A signed-in client may only earn/redeem against their own account.
    if (ctx.user.role === "CLIENT" && input.clientId !== ctx.user.clientId) {
      return fail(403, "You can only change your own loyalty points");
    }

    return prisma.$transaction(async (tx) => {
      const client = await tx.client.findFirst({ where: { id: input.clientId, businessId: ctx.businessId }, select: { id: true } });
      if (!client) return fail(404, "Client not found");

      // Get or create loyalty account
      let account = await tx.loyaltyAccount.findFirst({
        where: { clientId: input.clientId, client: { businessId: ctx.businessId } },
      });

      if (!account) {
        // Find the program for this business
        const program = await tx.loyaltyProgram.findFirst({ where: { businessId: ctx.businessId } });
        if (!program) {
          return fail(404, "No loyalty program found");
        }

        account = await tx.loyaltyAccount.create({
          data: {
            clientId: input.clientId,
            programId: program.id,
            pointsBalance: 0,
            lifetimePoints: 0,
          },
        });
      }

      // Update points
      const updatedAccount = await tx.loyaltyAccount.update({
        where: { clientId: input.clientId },
        data: {
          pointsBalance: { increment: input.points },
          lifetimePoints: { increment: input.points > 0 ? input.points : 0 },
        },
      });

      // Create transaction
      await tx.loyaltyTransaction.create({
        data: {
          accountId: updatedAccount.id,
          type: input.type,
          points: input.points,
          description: input.description,
        },
      });

      // Create activity
      await tx.activity.create({
        data: {
          clientId: input.clientId,
          userId: ctx.user.id,
          type: "LOYALTY_EARNED",
          title: `Earned ${input.points} points`,
          description: input.description,
          metadata: { points: input.points },
        },
      });

      return updatedAccount;
    });
  });
}
