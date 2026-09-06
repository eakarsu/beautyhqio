import { context, endpoint, mutation } from '@/lib/operations/core';
import { rescheduleAppointment, rescheduleSchema } from '@/lib/appointments/reschedule';
import { domainErrorResponse } from '@/lib/appointments/service';
import { NextResponse } from 'next/server';
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    const { id } = await params;
    const input = rescheduleSchema.parse(await req.json());
    try { return await mutation(ctx, req, 'appointment.reschedule', { id, ...input }, tx => rescheduleAppointment(tx, ctx, id, input)); }
    catch (e) { const r = domainErrorResponse(e); if (r) return NextResponse.json(r.body, { status: r.status }); throw e; }
  });
}
