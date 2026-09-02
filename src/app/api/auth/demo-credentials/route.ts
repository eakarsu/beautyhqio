import { NextResponse } from "next/server";
import { getDemoAccounts } from "@/lib/demo-accounts.server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const accounts = getDemoAccounts();
    const owner = accounts.find(({ key }) => key === "owner")!;
    const publicAccounts = accounts.map(({ key, email, password, role }) => ({ key, email, password, role }));
    return NextResponse.json(
      { email: owner.email, password: owner.password, accounts: publicAccounts },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Demo credentials unavailable" }, { status: 503 });
  }
}
