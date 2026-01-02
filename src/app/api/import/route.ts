import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

interface ImportRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
  tags?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { locationId, type, data, options } = body;

    if (!locationId || !type || !data) {
      return NextResponse.json(
        { error: "locationId, type, and data are required" },
        { status: 400 }
      );
    }

    // Get location to find businessId
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Verify user has access to this business
    if (!user.isPlatformAdmin && user.businessId !== location.businessId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as { row: number; error: string }[],
    };

    if (type === "clients") {
      const rows = data as ImportRow[];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.firstName || !row.lastName) {
            results.errors.push({
              row: i + 1,
              error: "firstName and lastName are required",
            });
            results.skipped++;
            continue;
          }

          // Check for existing client
          let existingClient = null;
          if (row.email) {
            existingClient = await prisma.client.findFirst({
              where: { email: row.email },
            });
          } else if (row.phone) {
            existingClient = await prisma.client.findFirst({
              where: { phone: row.phone },
            });
          }

          if (existingClient && options?.updateExisting) {
            // Update existing client
            await prisma.client.update({
              where: { id: existingClient.id },
              data: {
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email || existingClient.email,
                phone: row.phone || existingClient.phone,
                birthday: row.birthDate ? new Date(row.birthDate) : existingClient.birthday,
                notes: row.notes || existingClient.notes,
              },
            });
            results.updated++;
          } else if (existingClient && !options?.updateExisting) {
            results.skipped++;
          } else {
            // Create new client
            await prisma.client.create({
              data: {
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                phone: row.phone || "",
                birthday: row.birthDate ? new Date(row.birthDate) : undefined,
                notes: row.notes,
                referralSource: "IMPORT",
                businessId: location.businessId,
              },
            });
            results.imported++;
          }
        } catch (error) {
          results.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          results.skipped++;
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}
