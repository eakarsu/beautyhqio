import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { context, endpoint } from '@/lib/operations/core';
import { domainErrorResponse, transitionAppointment } from '@/lib/appointments/service';
export async function POST(req: Request) {
  return endpoint(async () => {
    const ctx = await context(['OWNER', 'MANAGER', 'RECEPTIONIST', 'CLIENT']);
    const { appointmentId } = z.object({ appointmentId: z.string().min(1).max(191) }).parse(await req.json());
    try { return await transitionAppointment(prisma, ctx.user, appointmentId, 'CHECKED_IN'); }
    catch (error) { const r = domainErrorResponse(error); if (r) return NextResponse.json(r.body, { status: r.status }); throw error; }
  });
}
