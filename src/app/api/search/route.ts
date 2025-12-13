import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/search - Global search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // clients, staff, services, products, appointments
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const searchTerm = query.toLowerCase();
    const results: Record<string, unknown[]> = {};

    // Search clients
    if (!type || type === "clients") {
      const clients = await prisma.client.findMany({
        where: {
          OR: [
            { firstName: { contains: searchTerm, mode: "insensitive" } },
            { lastName: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
            { phone: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
        take: limit,
      });
      results.clients = clients;
    }

    // Search staff
    if (!type || type === "staff") {
      const staff = await prisma.staff.findMany({
        where: {
          displayName: { contains: searchTerm, mode: "insensitive" },
        },
        select: {
          id: true,
          displayName: true,
          title: true,
          photo: true,
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        take: limit,
      });
      results.staff = staff;
    }

    // Search services
    if (!type || type === "services") {
      const services = await prisma.service.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          price: true,
          duration: true,
          category: {
            select: { name: true },
          },
        },
        take: limit,
      });
      results.services = services.map((s) => ({
        ...s,
        price: Number(s.price),
        category: s.category?.name || "Uncategorized",
      }));
    }

    // Search products
    if (!type || type === "products") {
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            { sku: { contains: searchTerm, mode: "insensitive" } },
            { brand: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          sku: true,
          brand: true,
          price: true,
          category: {
            select: { name: true },
          },
        },
        take: limit,
      });
      results.products = products.map((p) => ({
        ...p,
        price: Number(p.price),
        category: p.category?.name || "Uncategorized",
      }));
    }

    // Search appointments
    if (!type || type === "appointments") {
      const appointments = await prisma.appointment.findMany({
        where: {
          OR: [
            { notes: { contains: searchTerm, mode: "insensitive" } },
            {
              client: {
                OR: [
                  { firstName: { contains: searchTerm, mode: "insensitive" } },
                  { lastName: { contains: searchTerm, mode: "insensitive" } },
                ],
              },
            },
          ],
        },
        include: {
          client: {
            select: { firstName: true, lastName: true },
          },
          staff: {
            select: { displayName: true },
          },
        },
        take: limit,
        orderBy: { scheduledStart: "desc" },
      });
      results.appointments = appointments;
    }

    // Count total results
    const totalResults = Object.values(results).reduce(
      (sum: number, arr) => sum + arr.length,
      0
    );

    return NextResponse.json({
      query,
      totalResults,
      results,
    });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
