import { NextResponse } from 'next/server';
import { endpoint } from '@/lib/operations/core';
import { wearableContext } from '@/lib/operations/wearables';
import { beginHealthOAuth } from '@/lib/operations/google-health';
export async function POST() { return endpoint(async () => { const ctx = await wearableContext(); const result = await beginHealthOAuth(ctx); const response = NextResponse.json({ provider: 'google-health', authorization_url: result.authorization_url }); response.cookies.set('beauty-health-state', result.state, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https:') === true, path: '/api/integrations/fitbit', maxAge: 600 }); return response; }); }
