import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getAuthenticatedUser, type AuthenticatedUser, type UserRole } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export class OperationError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function fail(status: number, message: string): never { throw new OperationError(status, message); }
export const idSchema = z.string().trim().min(1).max(191);
export const moneySchema = z.number().finite().positive().max(1_000_000).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001, 'Use at most two decimal places');
export type Context = { user: AuthenticatedUser; businessId: string };
export async function context(roles: UserRole[] = ['OWNER', 'MANAGER', 'RECEPTIONIST']): Promise<Context> {
  const user = await getAuthenticatedUser();
  if (!user) return fail(401, 'Sign in to continue');
  if (!roles.includes(user.role) && !user.isPlatformAdmin) return fail(403, 'Your role cannot perform this action');
  // A platform administrator must enter a business through an assigned business account.
  if (!user.businessId) return fail(403, 'A business account is required');
  return { user, businessId: user.businessId };
}
export async function endpoint(work: () => Promise<unknown>) {
  try { const result = await work(); return result instanceof Response ? result : NextResponse.json(result); }
  catch (error) {
    if (error instanceof OperationError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || 'Invalid request' }, { status: 422 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code)) return NextResponse.json({ error: 'Conflicting update; refresh and retry' }, { status: 409 });
    console.error('Operation failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Operation failed. Please retry.' }, { status: 500 });
  }
}
export function json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)); }
export async function audit(tx: Prisma.TransactionClient, ctx: Context, action: string, entityType: string, entityId: string, changes: unknown) {
  await tx.auditLog.create({ data: { userId: ctx.user.id, businessId: ctx.businessId, action, entityType, entityId, changes: json(changes) } });
}
export async function mutation<T>(ctx: Context, req: Request, operation: string, input: unknown, work: (tx: Prisma.TransactionClient) => Promise<T>, authorize?: (tx: Prisma.TransactionClient) => Promise<unknown>): Promise<T> {
  const key = req.headers.get('Idempotency-Key');
  if (!key || !/^[\w][\w.:-]{7,127}$/.test(key)) return fail(422, 'Idempotency-Key must be 8–128 safe characters');
  const requestHash = createHash('sha256').update(JSON.stringify({ operation, userId: ctx.user.id, input })).digest('hex');
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ctx.businessId}, 0))::text`;
    if (authorize) await authorize(tx);
    const receipt = await tx.mutationReceipt.findUnique({ where: { businessId_key: { businessId: ctx.businessId, key } } });
    if (receipt) {
      if (receipt.requestHash !== requestHash) return fail(409, 'This request key was already used for another operation');
      return receipt.response as T;
    }
    const result = await work(tx);
    await tx.mutationReceipt.create({ data: { businessId: ctx.businessId, key, operation, requestHash, response: json(result) } });
    return result;
  }, { timeout: 15_000 });
}
export function csv(rows: (string | number | null | undefined)[][]): string {
  return rows.map(row => row.map(value => {
    let s = String(value ?? '');
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }).join(',')).join('\r\n');
}
export async function boundedBody(req:Request,max=100000){const origin=req.headers.get('origin');if(origin&&origin!==new URL(process.env.NEXTAUTH_URL||req.url).origin)fail(403,'Invalid request origin');const reader=req.body?.getReader();if(!reader)fail(400,'JSON body required');let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();fail(413,'Request too large')}chunks.push(value)}return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
