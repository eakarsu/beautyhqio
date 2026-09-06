import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { audit, fail, idSchema, type Context, json } from "./core";
import { redeemGift } from "./balances";
const amount = z
  .number()
  .finite()
  .nonnegative()
  .max(1000000)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001,
    "Use at most two decimal places",
  );
export const saleSchema = z
  .object({
    locationId: idSchema,
    clientId: idSchema.optional(),
    staffId: idSchema,
    appointmentId: idSchema.optional(),
    items: z
      .array(
        z
          .object({
            id: idSchema,
            type: z.enum(["SERVICE", "PRODUCT"]),
            quantity: z.number().int().min(1).max(100),
            unitPrice: amount.optional(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    discount: amount.default(0),
    discountReason: z.string().trim().max(1000).default(""),
    tip: amount.default(0),
    notes: z.string().trim().max(2000).default(""),
  })
  .strict();
export const taxSchema = z
  .object({
    taxRate: z.number().min(0).max(1).multipleOf(0.0001),
    servicesTaxable: z.boolean(),
    reviewConfirmed: z.literal(true),
  })
  .strict();
const cents = (n: Prisma.Decimal | number | string) =>
  Math.round(Number(n) * 100);
const manager = (ctx: Context) => {
  if (!["OWNER", "MANAGER"].includes(ctx.user.role))
    fail(403, "Manager review required");
};
export async function reviewTax(
  tx: Prisma.TransactionClient,
  ctx: Context,
  raw: unknown,
) {
  manager(ctx);
  const input = taxSchema.parse(raw);
  await tx.business.update({
    where: { id: ctx.businessId },
    data: {
      taxRate: input.taxRate,
      servicesTaxable: input.servicesTaxable,
      taxReviewedAt: new Date(),
      taxReviewedById: ctx.user.id,
    },
  });
  await audit(tx, ctx, "SALE_TAX_REVIEWED", "Business", ctx.businessId, input);
  return { saved: true };
}
async function taxPolicy(tx: Prisma.TransactionClient, ctx: Context) {
  const business = await tx.business.findUniqueOrThrow({
      where: { id: ctx.businessId },
    }),
    event = await tx.auditLog.findFirst({
      where: {
        businessId: ctx.businessId,
        entityId: ctx.businessId,
        action: "SALE_TAX_REVIEWED",
      },
      orderBy: { createdAt: "desc" },
    }),
    snapshot = event?.changes as Record<string, unknown> | null;
  if (
    !business.taxReviewedAt ||
    !event ||
    snapshot?.taxRate !== Number(business.taxRate) ||
    snapshot.servicesTaxable !== business.servicesTaxable
  )
    fail(
      409,
      "A manager must review and save current sales-tax settings before checkout",
    );
  return { business, policyId: event.id };
}
export async function createSale(
  tx: Prisma.TransactionClient,
  ctx: Context,
  raw: unknown,
) {
  const input = saleSchema.parse(raw),
    { business, policyId } = await taxPolicy(tx, ctx);
  if (
    !(await tx.location.count({
      where: {
        id: input.locationId,
        businessId: ctx.businessId,
        isActive: true,
      },
    }))
  )
    fail(404, "Location not found");
  if (
    !(await tx.staff.count({
      where: {
        id: input.staffId,
        locationId: input.locationId,
        isActive: true,
        user: { isActive: true, businessId: ctx.businessId },
      },
    }))
  )
    fail(404, "Staff is not active at this location");
  if (ctx.user.role === "STAFF" && ctx.user.staffId !== input.staffId)
    fail(403, "Staff can create only their own sales");
  if (
    input.clientId &&
    !(await tx.client.count({
      where: {
        id: input.clientId,
        businessId: ctx.businessId,
        status: "ACTIVE",
      },
    }))
  )
    fail(404, "Active client not found");
  if (input.appointmentId) {
    const appt = await tx.appointment.findFirst({
      where: {
        id: input.appointmentId,
        businessId: ctx.businessId,
        clientId: input.clientId,
        staffId: input.staffId,
        locationId: input.locationId,
        status: "COMPLETED",
      },
    });
    if (!input.clientId || !appt)
      fail(
        409,
        "Checkout requires this client’s completed appointment at the selected location",
      );
  }
  if (input.discount) {
    manager(ctx);
    if (input.discountReason.length < 5)
      fail(422, "Provide the reason for the discount");
  }
  const seen = new Set<string>(),
    lines: Prisma.TransactionLineItemCreateWithoutTransactionInput[] = [],
    stock: { id: string; quantity: number }[] = [];
  let subtotal = 0,
    taxable = 0;
  for (const item of input.items) {
    const key = item.type + ":" + item.id;
    if (seen.has(key)) fail(422, "Combine repeated cart lines");
    seen.add(key);
    let price = 0,
      name = "",
      isTaxable = false;
    if (item.type === "SERVICE") {
      const service = await tx.service.findFirst({
        where: { id: item.id, businessId: ctx.businessId, isActive: true },
      });
      if (!service) fail(404, "Service no longer available");
      price = cents(service.price);
      name = service.name;
      isTaxable = business.servicesTaxable;
      if (service.priceType !== "FIXED" && item.unitPrice === undefined)
        fail(422, "Variable-price services require a manager’s reviewed price");
    } else {
      const product = await tx.product.findFirst({
        where: { id: item.id, businessId: ctx.businessId, isActive: true },
      });
      if (!product) fail(404, "Product no longer available");
      price = cents(product.price);
      name = product.name;
      isTaxable = product.isTaxable;
      if (product.trackInventory) {
        const changed = await tx.product.updateMany({
          where: {
            id: item.id,
            businessId: ctx.businessId,
            quantityOnHand: { gte: item.quantity },
          },
          data: { quantityOnHand: { decrement: item.quantity } },
        });
        if (changed.count !== 1) fail(409, "Insufficient product stock");
        stock.push({ id: item.id, quantity: item.quantity });
      }
    }
    if (item.unitPrice !== undefined) {
      manager(ctx);
      if (input.discountReason.length < 5)
        fail(422, "Explain the reviewed price override");
      price = cents(item.unitPrice);
    }
    if (price < 0) fail(409, "Catalog price is invalid");
    const lineTotal = price * item.quantity;
    subtotal += lineTotal;
    if (isTaxable) taxable += lineTotal;
    lines.push({
      type: item.type,
      name,
      quantity: item.quantity,
      unitPrice: price / 100,
      totalPrice: lineTotal / 100,
      performedById: input.staffId,
      ...(item.type === "SERVICE"
        ? { service: { connect: { id: item.id } } }
        : { product: { connect: { id: item.id } } }),
    });
  }
  const discount = cents(input.discount);
  if (discount > subtotal) fail(422, "Discount exceeds subtotal");
  const taxableDiscount = subtotal
      ? Number(
          (BigInt(discount) * BigInt(taxable) +
            BigInt(Math.floor(subtotal / 2))) /
            BigInt(subtotal),
        )
      : 0,
    rate = Math.round(Number(business.taxRate) * 10000),
    tax = Number(
      (BigInt(taxable - taxableDiscount) * BigInt(rate) + BigInt(5000)) /
        BigInt(10000),
    ),
    total = subtotal - discount + tax + cents(input.tip);
  if (total <= 0 || total > 100000000)
    fail(422, "Sale total must be between $0.01 and $1,000,000");
  const sale = await tx.transaction.create({
    data: {
      transactionNumber: "SALE-" + randomUUID(),
      status: "PENDING",
      type: "SALE",
      locationId: input.locationId,
      staffId: input.staffId,
      clientId: input.clientId,
      appointmentId: input.appointmentId,
      subtotal: subtotal / 100,
      discountAmount: discount / 100,
      discountReason: input.discountReason,
      taxAmount: tax / 100,
      tipAmount: input.tip,
      totalAmount: total / 100,
      notes: input.notes,
      lineItems: { create: lines },
    },
  });
  await audit(tx, ctx, "SALE_DRAFT_CREATED", "Transaction", sale.id, {
    totalCents: total,
    taxCents: tax,
    policyId,
    stock,
  });
  return sale;
}
export async function saleFor(
  tx: Prisma.TransactionClient,
  ctx: Context,
  id: string,
) {
  const sale = await tx.transaction.findFirst({
    where: { id, location: { businessId: ctx.businessId } },
    include: { lineItems: true, payments: true },
  });
  if (!sale) fail(404, "Sale not found");
  if (ctx.user.role === "STAFF" && sale.staffId !== ctx.user.staffId)
    fail(403, "Staff can access only their own sales");
  return sale;
}
export async function noPendingSaleProvider(
  tx: Prisma.TransactionClient,
  id: string,
) {
  if (
    await tx.salonCheckout.count({
      where: {
        transactionId: id,
        status: { in: ["PENDING", "OPEN", "UNKNOWN"] },
      },
    })
  )
    fail(409, "Reconcile or expire the online checkout first");
  if (
    await tx.paymentRefund.count({
      where: {
        payment: { transactionId: id },
        status: { in: ["PENDING", "PROCESSING", "UNKNOWN"] },
      },
    })
  )
    fail(409, "Reconcile the pending refund first");
}
export async function saleBalance(tx: Prisma.TransactionClient, id: string) {
  const [sale, paid, refunds] = await Promise.all([
    tx.transaction.findUniqueOrThrow({ where: { id } }),
    tx.transactionPayment.aggregate({
      where: { transactionId: id, verifiedAt: { not: null } },
      _sum: { amount: true },
    }),
    tx.paymentRefund.aggregate({
      where: { payment: { transactionId: id }, status: "SUCCEEDED" },
      _sum: { amount: true },
    }),
  ]);
  return {
    sale,
    paidCents: cents(paid._sum.amount || 0) - cents(refunds._sum.amount || 0),
    balanceCents:
      cents(sale.totalAmount) -
      cents(paid._sum.amount || 0) +
      cents(refunds._sum.amount || 0),
  };
}
export async function saleAction(
  tx: Prisma.TransactionClient,
  ctx: Context,
  raw: unknown,
) {
  const input = z
      .object({
        action: z.enum(["issue", "void", "payment"]),
        id: idSchema,
        version: z.number().int().positive(),
        reviewConfirmed: z.boolean().optional(),
        reason: z.string().trim().max(1000).optional(),
        amount: amount.optional(),
        method: z.enum(["CASH", "GIFT_CARD"]).optional(),
        giftCardCode: z.string().max(100).optional(),
        cashReceived: amount.optional(),
        receivedConfirmed: z.boolean().optional(),
      })
      .strict()
      .parse(raw),
    sale = await saleFor(tx, ctx, input.id);
  if (sale.version !== input.version)
    fail(409, "Sale changed; reload before continuing");
  if (sale.status !== "PENDING") fail(409, "Only pending sales can change");
  await noPendingSaleProvider(tx, sale.id);
  const created = await tx.auditLog.findFirst({
    where: {
      businessId: ctx.businessId,
      entityId: sale.id,
      action: "SALE_DRAFT_CREATED",
    },
  });
  if (!created) fail(409, "This legacy sale needs separate reconciliation");
  if (input.action === "void") {
    if ((await saleBalance(tx, sale.id)).paidCents !== 0)
      fail(409, "Refund payments before closing a paid sale");
    if (!input.reason || input.reason.length < 5) fail(422, "Explain the void");
    const original = created.changes as {
      stock: { id: string; quantity: number }[];
    };
    for (const item of original.stock)
      await tx.product.update({
        where: { id: item.id },
        data: { quantityOnHand: { increment: item.quantity } },
      });
    const saved = await tx.transaction.update({
      where: { id: sale.id },
      data: { status: "VOIDED", version: { increment: 1 } },
    });
    await audit(tx, ctx, "SALE_VOIDED", "Transaction", sale.id, {
      reason: input.reason,
      stock: original.stock,
    });
    return saved;
  }
  if (input.action === "issue") {
    if (sale.reviewedAt) fail(409, "Sale already reviewed");
    if (!input.reviewConfirmed)
      fail(422, "Confirm review of scope, prices and tax");
    const policy = await taxPolicy(tx, ctx);
    if ((created.changes as { policyId: string }).policyId !== policy.policyId)
      fail(
        409,
        "Tax policy changed. Void and recreate the draft before payment",
      );
    const saved = await tx.transaction.update({
      where: { id: sale.id },
      data: {
        reviewedAt: new Date(),
        reviewedById: ctx.user.id,
        version: { increment: 1 },
      },
    });
    await audit(tx, ctx, "SALE_REVIEWED", "Transaction", sale.id, {
      version: saved.version,
      total: sale.totalAmount.toString(),
    });
    return saved;
  }
  if (!sale.reviewedAt) fail(409, "Review the sale before recording payment");
  const value = input.amount === undefined ? 0 : cents(input.amount),
    balance = await saleBalance(tx, sale.id);
  if (value <= 0 || value > balance.balanceCents)
    fail(422, "Payment exceeds the outstanding balance");
  if (!input.receivedConfirmed)
    fail(422, "Confirm this payment has actually been received");
  let giftCardId: string | undefined;
  if (input.method === "CASH") {
    if (input.cashReceived === undefined || cents(input.cashReceived) < value)
      fail(422, "Enter sufficient cash received");
  } else if (input.method === "GIFT_CARD") {
    if (!input.giftCardCode) fail(422, "Gift card code required");
    await redeemGift(tx, ctx, {
      code: input.giftCardCode,
      amount: value / 100,
      clientId: sale.clientId || undefined,
    });
    giftCardId = (
      await tx.giftCard.findUniqueOrThrow({
        where: { code: input.giftCardCode },
      })
    ).id;
  } else
    fail(
      422,
      "Select cash or gift card; card payments use verified Stripe checkout",
    );
  const payment = await tx.transactionPayment.create({
      data: {
        transactionId: sale.id,
        method: input.method,
        amount: value / 100,
        verifiedAt: new Date(),
        actorId: ctx.user.id,
        source: input.method,
        giftCardId,
      },
    }),
    settled = value === balance.balanceCents;
  await tx.transaction.update({
    where: { id: sale.id },
    data: {
      status: settled ? "COMPLETED" : "PENDING",
      version: { increment: 1 },
    },
  });
  await audit(tx, ctx, "SALE_PAYMENT_RECORDED", "Transaction", sale.id, {
    paymentId: payment.id,
    amountCents: value,
    method: input.method,
    changeCents:
      input.method === "CASH" ? cents(input.cashReceived!) - value : 0,
  });
  return {
    payment,
    balanceCents: balance.balanceCents - value,
    changeCents:
      input.method === "CASH" ? cents(input.cashReceived!) - value : 0,
  };
}
