import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/quickbooks";

// GET /api/quickbooks/auth - Get QuickBooks OAuth URL
export async function GET() {
  try {
    const authUrl = getAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error generating QuickBooks auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
