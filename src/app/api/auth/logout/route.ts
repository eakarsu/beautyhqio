import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // For JWT-based auth, logout is handled client-side by removing tokens
  // This endpoint exists for API compatibility
  return NextResponse.json({
    message: "Logged out successfully"
  });
}
