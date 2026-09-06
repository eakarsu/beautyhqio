import { NextRequest, NextResponse } from 'next/server';
import { endpoint, fail } from '@/lib/operations/core';
import { wearableContext } from '@/lib/operations/wearables';
import { completeHealthOAuth } from '@/lib/operations/google-health';
export async function GET(req: NextRequest) { return endpoint(async () => { const ctx = await wearableContext(); const state = req.nextUrl.searchParams.get('state'); const code = req.nextUrl.searchParams.get('code'); if (!state || !code || req.cookies.get('beauty-health-state')?.value !== state) return fail(403, 'Authorization state mismatch'); await completeHealthOAuth(ctx, state, code); const response = NextResponse.redirect(new URL('/integrations?connected=google-health', process.env.NEXTAUTH_URL)); response.cookies.delete('beauty-health-state'); return response; }); }
