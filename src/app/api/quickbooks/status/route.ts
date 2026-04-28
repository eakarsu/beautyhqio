import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/quickbooks/status - Connection status for the UI
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst({
      where: { id: "default" },
    });

    if (!settings?.quickbooksAccessToken || !settings?.quickbooksRealmId) {
      return NextResponse.json({
        connected: false,
        expired: false,
      });
    }

    const expired =
      !!settings.quickbooksTokenExpiry &&
      new Date(settings.quickbooksTokenExpiry) < new Date();

    return NextResponse.json({
      connected: true,
      expired,
      realmId: settings.quickbooksRealmId,
      tokenExpiry: settings.quickbooksTokenExpiry,
    });
  } catch (error) {
    console.error("Error reading QuickBooks status:", error);
    return NextResponse.json(
      { error: "Failed to read QuickBooks status" },
      { status: 500 }
    );
  }
}

// DELETE /api/quickbooks/status - Disconnect
export async function DELETE() {
  try {
    await prisma.settings.update({
      where: { id: "default" },
      data: {
        quickbooksAccessToken: null,
        quickbooksRefreshToken: null,
        quickbooksRealmId: null,
        quickbooksTokenExpiry: null,
      },
    });
    return NextResponse.json({ disconnected: true });
  } catch (error) {
    console.error("Error disconnecting QuickBooks:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
