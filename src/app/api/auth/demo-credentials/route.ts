import { NextRequest, NextResponse } from "next/server";
import { getDemoAccounts } from "@/lib/demo-accounts.server";

export const dynamic = "force-dynamic";

/**
 * Hosts allowed to read demo credentials. Defaults to local development only;
 * an operator opts a demo deployment in with
 * `DEMO_CREDENTIAL_HOSTS=beautyhq.io,www.beautyhq.io`.
 */
const DEFAULT_ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

function allowedHosts(): string[] {
  const raw = process.env.DEMO_CREDENTIAL_HOSTS?.trim();
  if (!raw) return DEFAULT_ALLOWED_HOSTS;
  const parsed = raw.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_HOSTS;
}

function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  // x-forwarded-host can be a comma-separated chain; take the first entry and
  // drop any port.
  return value.split(",")[0].trim().split(":")[0].toLowerCase();
}

function hostAllowed(host: string, hosts: string[]): boolean {
  if (!host) return false;
  return hosts.includes(host);
}

export async function GET(request: NextRequest) {
  const headers = { "cache-control": "no-store, private" };
  const hosts = allowedHosts();

  // Prefer the forwarded/host header: behind a proxy `request.nextUrl` can
  // reflect the internal bind address rather than the public domain.
  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const hostname = normalizeHost(rawHost);

  const origin = request.headers.get("origin");
  const proto = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol).replace(/:$/, "");
  const originCandidates = [
    process.env.NEXTAUTH_URL,
    hostname ? `${proto}://${rawHost.split(",")[0].trim()}` : "",
    request.nextUrl.origin,
  ].filter((value): value is string => Boolean(value));
  const sameOrigin = !origin || originCandidates.includes(origin);

  if (
    process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL !== "true" ||
    !hostAllowed(hostname, hosts) ||
    !sameOrigin
  ) {
    return NextResponse.json({ enabled: false, accounts: [] }, { headers });
  }

  try {
    const accounts = getDemoAccounts();
    const owner = accounts.find(({ key }) => key === "owner")!;
    if (request.nextUrl.searchParams.get("status") === "1") {
      return NextResponse.json(
        { enabled: true, accounts: accounts.map(({ key, email, role }) => ({ key, email, role })) },
        { headers },
      );
    }
    const publicAccounts = accounts.map(({ key, email, password, role }) => ({ key, email, password, role }));
    return NextResponse.json(
      { enabled: true, email: owner.email, password: owner.password, accounts: publicAccounts },
      { headers },
    );
  } catch {
    return NextResponse.json({ enabled: false, accounts: [] }, { headers });
  }
}
