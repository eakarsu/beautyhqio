import { NextRequest } from 'next/server';
import { context, endpoint } from '@/lib/operations/core';
import { startCardDepositCheckout } from '@/lib/appointments/card-deposit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    const { id } = await params;
    return startCardDepositCheckout(ctx, request, id);
  });
}
