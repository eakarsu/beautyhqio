import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/settings - Get settings
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "default",
          businessName: "Glamour Studio",
          address: "123 Beauty Lane, Suite 100",
          phone: "(555) 123-4567",
          email: "hello@glamourstudio.com",
          taxRate: 0.0875,
          openTime: "9:00 AM",
          closeTime: "7:00 PM",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: Request) {
  try {
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
