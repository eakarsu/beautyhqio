import { NextRequest } from 'next/server';
import { z } from 'zod';
import { boundedBody, context, endpoint } from '@/lib/operations/core';
import { reconcileCardDeposit } from '@/lib/appointments/card-deposit';

const input = z.object({ kind: z.enum(['checkout', 'refund']), reference: z.string().trim().min(7).max(190), expire: z.boolean().optional() }).strict();
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']);
    const body = input.parse(await boundedBody(request));
    return reconcileCardDeposit(ctx, (await params).id, body.kind, body.reference, body.expire);
  });
}
