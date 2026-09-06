import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  context,
  endpoint,
  mutation,
  boundedBody,
  fail,
  idSchema,
} from "@/lib/operations/core";
import { createSale, saleAction, reviewTax } from "@/lib/operations/sales";
import {
  startSaleCheckout,
  reconcileSaleCheckout,
  refundSalePayment,
  reconcileSaleRefund,
} from "@/lib/operations/sale-payments";
export const GET = () =>
  endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const [
      business,
      locations,
      staff,
      clients,
      products,
      services,
      sales,
      checkouts,
      refunds,
    ] = await Promise.all([
      prisma.business.findUniqueOrThrow({
        where: { id: ctx.businessId },
        select: {
          id: true,
          taxRate: true,
          taxReviewedAt: true,
          servicesTaxable: true,
        },
      }),
      prisma.location.findMany({
        where: { businessId: ctx.businessId, isActive: true },
        select: { id: true, name: true },
      }),
      prisma.staff.findMany({
        where: {
          location: { businessId: ctx.businessId },
          isActive: true,
          ...(ctx.user.role === "STAFF"
            ? { id: ctx.user.staffId || "none" }
            : {}),
        },
        select: {
          id: true,
          displayName: true,
          locationId: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.client.findMany({
        where: { businessId: ctx.businessId, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
        take: 500,
      }),
      prisma.product.findMany({
        where: { businessId: ctx.businessId, isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          quantityOnHand: true,
          trackInventory: true,
          isTaxable: true,
        },
        take: 500,
      }),
      prisma.service.findMany({
        where: { businessId: ctx.businessId, isActive: true },
        select: { id: true, name: true, price: true, priceType: true },
        take: 500,
      }),
      prisma.transaction.findMany({
        where: {
          location: { businessId: ctx.businessId },
          ...(ctx.user.role === "STAFF"
            ? { staffId: ctx.user.staffId || "none" }
            : {}),
        },
        include: {
          lineItems: true,
          payments: { include: { refunds: true } },
          client: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.salonCheckout.findMany({
        where: {
          businessId: ctx.businessId,
          ...(ctx.user.role === "STAFF"
            ? { transaction: { staffId: ctx.user.staffId || "none" } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.paymentRefund.findMany({
        where: {
          businessId: ctx.businessId,
          ...(ctx.user.role === "STAFF"
            ? {
                payment: {
                  transaction: { staffId: ctx.user.staffId || "none" },
                },
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);
    return {
      role: ctx.user.role,
      business,
      locations,
      staff,
      clients,
      products,
      services,
      sales,
      checkouts,
      refunds,
    };
  });
export const POST = (req: Request) =>
  endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]),
      input = z.object({action:z.string()}).passthrough().parse(await boundedBody(req)),
      { action, ...data } = input;
    if (action === "checkout")
      return startSaleCheckout(ctx, req, idSchema.parse(input.id));
    if (action === "checkout-reconcile" || action === "checkout-expire")
      return reconcileSaleCheckout(
        ctx,
        idSchema.parse(input.id),
        idSchema.parse(input.providerRef),
        action === "checkout-expire",
      );
    if (action === "refund") return refundSalePayment(ctx, req, data);
    if (action === "refund-reconcile")
      return reconcileSaleRefund(
        ctx,
        idSchema.parse(input.id),
        idSchema.parse(input.providerRef),
      );
    return mutation(ctx, req, "sale." + action, input, async (tx) => {
      if (
        !(await tx.user.count({
          where: {
            id: ctx.user.id,
            isActive: true,
            businessId: ctx.businessId,
            role: ctx.user.role as never,
          },
        }))
      )
        fail(403, "Account access changed");
      if (action === "create") return createSale(tx, ctx, data);
      if (action === "tax") return reviewTax(tx, ctx, data);
      if (["issue", "void", "payment"].includes(action))
        return saleAction(tx, ctx, input);
      return fail(422, "Choose a supported sale action");
    });
  });
