import crypto from 'node:crypto';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findFirst({ where: { id: userId, isActive: true }, select: { id: true, businessId: true } });
  if (!user) return NextResponse.json({ error: 'Identity inactive' }, { status: 401 });
  const { prompt } = await request.json().catch(() => ({ prompt: '' })) as { prompt?: string };
  const input = String(prompt || '').trim();
  if (!input) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  const apiKey = process.env.OPENROUTER_API_KEY, baseUrl = process.env.OPENROUTER_BASE_URL, model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !baseUrl || !model) throw new Error('OpenRouter is not configured');
  const providerResponse = await fetch(baseUrl.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST', headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Provide concise beauty business operations advice with risks and auditable next actions.' }, { role: 'user', content: input }], temperature: 0.2 }),
  });
  if (!providerResponse.ok) throw new Error('OpenRouter returned ' + providerResponse.status);
  const payload = await providerResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('OpenRouter returned empty content');
  const persistedId = crypto.randomUUID();
  await prisma.$executeRaw`INSERT INTO "runtime_ai_results" ("id","business_id","user_id","prompt","content","provider","model") VALUES (${persistedId},${user.businessId},${user.id},${input},${content},'openrouter',${model})`;
  return NextResponse.json({ content, provider: 'openrouter', model, persistedId });
}
