import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

const purchaseSchema = z.object({
  clientId: idSchema,
  pricePaid: z.coerce.number().finite().nonnegative().max(1_000_000).optional().nullable(),
});

// POST /api/packages/[id]/purchase - Purchase a package for a client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "CLIENT"]);
    const { id } = await params;
    const input = purchaseSchema.parse(await request.json());

    // A signed-in client may only purchase a package for their own profile.
    if (ctx.user.role === "CLIENT" && input.clientId !== ctx.user.clientId) {
      return fail(403, "You can only buy a package for your own profile");
    }

    return prisma.$transaction(async (tx) => {
      // Get the package
      const pkg = await tx.package.findFirst({
        where: { id, businessId: ctx.businessId },
        include: {
          services: true,
        },
      });

      if (!pkg) return fail(404, "Package not found");
      if (!pkg.isActive) return fail(400, "Package is no longer available");

      const client = await tx.client.findFirst({ where: { id: input.clientId, businessId: ctx.businessId }, select: { id: true } });
      if (!client) return fail(404, "Client not found");

      // Calculate total services
      const totalServices = pkg.services.reduce((sum, s) => sum + s.quantity, 0);

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

      // Create the purchase
      const purchase = await tx.packagePurchase.create({
        data: {
          packageId: id,
          clientId: input.clientId,
          pricePaid: input.pricePaid ?? pkg.price,
          totalServices,
          remainingServices: totalServices,
          expiresAt,
        },
        include: {
          package: true,
        },
      });

      // Create activity for client
      await tx.activity.create({
        data: {
          clientId: input.clientId,
          userId: ctx.user.id,
          type: "PURCHASE",
          title: `Purchased ${pkg.name} package`,
          description: `${totalServices} services, expires ${expiresAt.toLocaleDateString()}`,
          metadata: {
            purchaseId: purchase.id,
            packageId: id,
            packageName: pkg.name,
          },
        },
      });

      return {
        ...purchase,
        pricePaid: Number(purchase.pricePaid),
        package: {
          ...purchase.package,
          price: Number(purchase.package.price),
          originalValue: Number(purchase.package.originalValue),
          savingsAmount: Number(purchase.package.savingsAmount),
          savingsPercent: Number(purchase.package.savingsPercent),
        },
      };
    });
  });
}
