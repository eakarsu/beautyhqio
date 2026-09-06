import { NextRequest, NextResponse } from "next/server";
import { getDemoAccounts } from "@/lib/demo-accounts.server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const headers = { "cache-control": "no-store, private" };
  const localHosts = ['localhost', '127.0.0.1', '[::1]'];
  const forwardedHost = request.headers.get('x-forwarded-host');
  const origin = request.headers.get('origin');
  const sameLocalOrigin = !origin || [process.env.NEXTAUTH_URL, request.nextUrl.origin, `${request.nextUrl.protocol}//${request.headers.get('host')}`].includes(origin);
  if (process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL !== "true" || !localHosts.includes(request.nextUrl.hostname) || (forwardedHost && !localHosts.some(host => forwardedHost === host || forwardedHost.startsWith(host + ':'))) || !sameLocalOrigin) {
    return NextResponse.json({ enabled: false, accounts: [] }, { headers });
  }

  try {
    const accounts = getDemoAccounts();
    const owner = accounts.find(({ key }) => key === "owner")!;
    if (request.nextUrl.searchParams.get('status') === '1') {
      return NextResponse.json({ enabled: true, accounts: accounts.map(({ key, email, role }) => ({ key, email, role })) }, { headers });
    }
    const publicAccounts = accounts.map(({ key, email, password, role }) => ({ key, email, password, role }));
    return NextResponse.json(
      { enabled: true, email: owner.email, password: owner.password, accounts: publicAccounts },
      { headers }
    );
  } catch {
    return NextResponse.json({ enabled: false, accounts: [] }, { headers });
  }
}
