import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { audit, fail, idSchema, moneySchema, type Context } from './core';

export const giftRedemptionSchema = z.object({ code: z.string().trim().min(1).max(100), amount: moneySchema, clientId: idSchema.optional() });
export async function redeemGift(tx: Prisma.TransactionClient, ctx: Context, input: z.infer<typeof giftRedemptionSchema>) {
  const card = await tx.giftCard.findFirst({ where: { code: input.code, businessId: ctx.businessId } });
  if (!card) return fail(404, 'Gift card not found');
  if (card.status !== 'active' || (card.expiresAt && card.expiresAt <= new Date())) return fail(409, 'Gift card is inactive or expired');
  if (input.clientId && !await tx.client.findFirst({ where: { id: input.clientId, businessId: ctx.businessId } })) return fail(404, 'Client not found');
  const amount = new Prisma.Decimal(input.amount);
  if (card.currentBalance.lessThan(amount)) return fail(409, 'Insufficient balance');
  const balance = card.currentBalance.minus(amount);
  const changed = await tx.giftCard.updateMany({ where: { id: card.id, currentBalance: card.currentBalance, status: 'active' }, data: { currentBalance: balance, status: balance.isZero() ? 'redeemed' : 'active' } });
  if (changed.count !== 1) return fail(409, 'Gift-card balance changed; retry');
  await tx.giftCardUsage.create({ data: { giftCardId: card.id, amount, balanceAfter: balance } });
  if (input.clientId) await tx.activity.create({ data: { clientId: input.clientId, userId: ctx.user.id, type: 'GIFT_CARD_REDEEMED', title: 'Gift card redeemed', metadata: { giftCardId: card.id, amount: input.amount } } });
  await audit(tx, ctx, 'GIFT_CARD_REDEEMED', 'GiftCard', card.id, { amount: input.amount, balanceAfter: balance.toString() });
  return { success: true, amountRedeemed: input.amount, remainingBalance: balance.toNumber() };
}

export const loyaltyRedemptionSchema = z.object({ clientId: idSchema, rewardId: idSchema });
export async function redeemLoyalty(tx: Prisma.TransactionClient, ctx: Context, input: z.infer<typeof loyaltyRedemptionSchema>) {
  if (ctx.user.role === 'CLIENT' && input.clientId !== ctx.user.clientId) return fail(403, 'You can redeem only your own rewards');
  const reward = await tx.loyaltyReward.findFirst({ where: { id: input.rewardId, isActive: true, program: { businessId: ctx.businessId, isActive: true } } });
  if (!reward || reward.pointsCost <= 0) return fail(404, 'Reward not available');
  const account = await tx.loyaltyAccount.findFirst({ where: { clientId: input.clientId, programId: reward.programId, client: { businessId: ctx.businessId } } });
  if (!account) return fail(404, 'Loyalty account not found');
  const changed = await tx.loyaltyAccount.updateMany({ where: { id: account.id, pointsBalance: { gte: reward.pointsCost } }, data: { pointsBalance: { decrement: reward.pointsCost } } });
  if (changed.count !== 1) return fail(409, 'Insufficient points');
  const redemption = await tx.loyaltyTransaction.create({ data: { accountId: account.id, type: 'redeem', points: -reward.pointsCost, description: `Redeemed: ${reward.name}` } });
  await tx.activity.create({ data: { clientId: input.clientId, userId: ctx.user.id, type: 'LOYALTY_REDEEMED', title: `Redeemed ${reward.name}`, metadata: { rewardId: reward.id, redemptionId: redemption.id } } });
  await audit(tx, ctx, 'LOYALTY_REDEEMED', 'LoyaltyAccount', account.id, { rewardId: reward.id, redemptionId: redemption.id, points: reward.pointsCost });
  const updated = await tx.loyaltyAccount.findUniqueOrThrow({ where: { id: account.id } });
  return { success: true, reward, redemptionId: redemption.id, remainingPoints: updated.pointsBalance };
}

export const receiveSchema = z.object({ items: z.array(z.object({ itemId: idSchema, quantityReceived: z.number().int().positive().max(100000) })).min(1).max(200) }).refine(i => new Set(i.items.map(x => x.itemId)).size === i.items.length, 'Each order line must appear once');
export async function receiveOrder(tx: Prisma.TransactionClient, ctx: Context, id: string, input: z.infer<typeof receiveSchema>) {
  const order = await tx.purchaseOrder.findFirst({ where: { id, vendor: { businessId: ctx.businessId } }, include: { items: true } });
  if (!order) return fail(404, 'Purchase order not found');
  if (!['submitted', 'partial'].includes(order.status)) return fail(409, 'Only submitted or partially received orders can be received');
  for (const item of input.items) {
    const line = order.items.find(l => l.id === item.itemId);
    if (!line || line.quantityReceived + item.quantityReceived > line.quantityOrdered) return fail(422, 'Received quantity exceeds the outstanding order quantity');
    const changed = await tx.purchaseOrderItem.updateMany({ where: { id: line.id, quantityReceived: line.quantityReceived }, data: { quantityReceived: { increment: item.quantityReceived } } });
    if (changed.count !== 1) return fail(409, 'Order changed; refresh and retry');
    const stock = await tx.product.updateMany({ where: { id: line.productId, businessId: ctx.businessId }, data: { quantityOnHand: { increment: item.quantityReceived } } });
    if (stock.count !== 1) return fail(422, 'An order product is unavailable in this business');
  }
  const items = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
  const newStatus = items.every(l => l.quantityReceived === l.quantityOrdered) ? 'received' : 'partial';
  await tx.purchaseOrder.update({ where: { id }, data: { status: newStatus, receivedDate: newStatus === 'received' ? new Date() : null } });
  await audit(tx, ctx, 'PURCHASE_ORDER_RECEIVED', 'PurchaseOrder', id, input);
  return { success: true, newStatus, receivedItems: input.items };
}
