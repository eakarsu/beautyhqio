import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/locations/[id]/staff - Get staff for a location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: locationId } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Get all staff for this location
    const staff = await prisma.staff.findMany({
      where: {
        locationId: locationId,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { displayName: "asc" },
    });

    // If serviceId provided, prefer staff who can perform that service
    // But if no one matches, return all staff
    let filteredStaff = staff;
    if (serviceId) {
      const matchingStaff = staff.filter(s => s.serviceIds.includes(serviceId));
      if (matchingStaff.length > 0) {
        filteredStaff = matchingStaff;
      }
    }

    return NextResponse.json(
      filteredStaff.map((s) => ({
        id: s.id,
        displayName:
          s.displayName ||
          `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.trim() ||
          "Staff",
        photo: s.photo,
        title: s.title,
      }))
    );
  } catch (error) {
    console.error("Error fetching location staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}
