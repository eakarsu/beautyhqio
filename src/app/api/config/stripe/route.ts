import { NextResponse } from "next/server";

// GET /api/config/stripe - Get Stripe publishable key at runtime
// This allows the key to be passed via runtime environment variables
export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
                         process.env.STRIPE_PUBLISHABLE_KEY || "";

  if (!publishableKey) {
    return NextResponse.json(
      { error: "Stripe publishable key not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({ publishableKey });
}
