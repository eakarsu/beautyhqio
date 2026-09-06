import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, context, endpoint, json,fail,boundedBody } from '@/lib/operations/core';
import { connectionSchemas, encryptCredentials, decryptCredentials,providerSchema } from '@/lib/operations/connections';
export async function GET() {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']);
    const rows = await prisma.integrationConnection.findMany({ where: { businessId: ctx.businessId, provider: { in: providerSchema.options } }, select: { provider: true, status: true, lastVerifiedAt: true, lastError: true, updatedAt: true } });
    return { connections: rows, providers: providerSchema.options, encryptionConfigured: /^[a-f0-9]{64}$/i.test(process.env.INTEGRATION_ENCRYPTION_KEY || ''), canEdit: ctx.user.role === 'OWNER' };
  });
}
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER']);
    const input = z.object({ provider: providerSchema, action: z.enum(['save', 'disconnect']), credentials: z.unknown().optional() }).parse(await boundedBody(req));
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ctx.businessId},0))::text`;
      if(input.provider==='stripe'){
        const unresolved=await tx.salonCheckout.count({where:{businessId:ctx.businessId,status:{in:['PENDING','OPEN','UNKNOWN']}}})+await tx.paymentRefund.count({where:{businessId:ctx.businessId,status:{in:['PENDING','PROCESSING','UNKNOWN']}}});if(unresolved)fail(409,'Reconcile pending payments and refunds before changing this connection');
        const previous=await tx.integrationConnection.findUnique({where:{businessId_provider:{businessId:ctx.businessId,provider:'stripe'}}});
        if(previous&&await tx.transactionPayment.count({where:{source:'STRIPE',verifiedAt:{not:null},transaction:{location:{businessId:ctx.businessId}}}})){
          const old=connectionSchemas.stripe.parse(decryptCredentials(ctx.businessId,'stripe',previous.encryptedCredentials));
          if(input.action==='disconnect'||connectionSchemas.stripe.parse(input.credentials).secretKey!==old.secretKey)fail(409,'Verified payments exist. Account and receipt migration is required before replacing the Stripe credential.');
        }
      }

      if (input.action === 'disconnect') {
        await tx.integrationConnection.deleteMany({ where: { businessId: ctx.businessId, provider: input.provider } });
      } else {
        const parsed = connectionSchemas[input.provider].parse(input.credentials);
        const encryptedCredentials = encryptCredentials(ctx.businessId, input.provider, parsed);
        await tx.integrationConnection.upsert({ where: { businessId_provider: { businessId: ctx.businessId, provider: input.provider } }, create: { businessId: ctx.businessId, provider: input.provider, encryptedCredentials, configuration: json({}), status: 'CONFIGURED' }, update: { encryptedCredentials, status: 'CONFIGURED', lastError: null, lastVerifiedAt: null } });
      }
      await audit(tx, ctx, `CONNECTION_${input.action.toUpperCase()}`, 'IntegrationConnection', input.provider, { provider: input.provider });
      return { success: true, provider: input.provider, status: input.action === 'disconnect' ? 'DISCONNECTED' : 'CONFIGURED' };
    });
  });
}
