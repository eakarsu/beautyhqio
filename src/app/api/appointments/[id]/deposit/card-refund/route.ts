import { NextRequest } from 'next/server';
import { z } from 'zod';
import { boundedBody, context, endpoint } from '@/lib/operations/core';
import { requestCardDepositRefund } from '@/lib/appointments/card-deposit';

const input = z.object({ reason: z.string().trim().min(5).max(500) }).strict();
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER']);
    const { reason } = input.parse(await boundedBody(request));
    return requestCardDepositRefund(ctx, request, (await params).id, reason);
  });
}
