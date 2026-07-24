import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findFirst({ where: { id, isActive: true }, select: { id: true, email: true, role: true, businessId: true } });
  return user ? NextResponse.json({ user }) : NextResponse.json({ error: 'Identity inactive' }, { status: 401 });
}
