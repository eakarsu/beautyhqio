import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRoles } from "@/lib/api-auth";

// GET /api/settings - Get settings (authenticated; never creates a row)
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    // Missing settings are reported as empty; creation is a write operation.
    return NextResponse.json(settings ?? {});
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings (owner/management only)
export async function PUT(request: Request) {
  try {
    const auth = await requireRoles(["OWNER", "MANAGER"]);
    if (auth instanceof NextResponse) return auth;

    const data = await request.json();

    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: {
        businessName: data.businessName,
        address: data.address,
        phone: data.phone,
        email: data.email,
        taxRate: data.taxRate ? parseFloat(data.taxRate) : undefined,
        openTime: data.openTime,
        closeTime: data.closeTime,
        googleCalendarEnabled: data.googleCalendarEnabled,
      },
      create: {
        id: "default",
        businessName: data.businessName,
        address: data.address,
        phone: data.phone,
        email: data.email,
        taxRate: data.taxRate ? parseFloat(data.taxRate) : 0.0875,
        openTime: data.openTime,
        closeTime: data.closeTime,
        googleCalendarEnabled: data.googleCalendarEnabled,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
