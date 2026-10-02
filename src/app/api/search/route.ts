import { NextRequest } from "next/server";
import { context, endpoint } from "@/lib/operations/core";
import { prisma } from "@/lib/prisma";

// GET /api/search - Global search, scoped to the caller's own business.
//
// Previously this endpoint had no authentication and no tenant filter, so any
// anonymous caller could search every tenant's clients (name, email, phone).
// Every query below is now constrained by ctx.businessId.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // clients, staff, services, products, appointments
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10) || 10, 1), 50);

    if (!query || query.length < 2) {
      return { error: "Search query must be at least 2 characters" };
    }

    const searchTerm = query.slice(0, 100);
    const results: Record<string, unknown[]> = {};

    // Search clients
    if (!type || type === "clients") {
      results.clients = await prisma.client.findMany({
        where: {
          businessId: ctx.businessId,
          OR: [
            { firstName: { contains: searchTerm, mode: "insensitive" } },
            { lastName: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
            { phone: { contains: searchTerm } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        take: limit,
      });
    }

    // Search staff (scoped through the location's business)
    if (!type || type === "staff") {
      results.staff = await prisma.staff.findMany({
        where: {
          location: { businessId: ctx.businessId },
          displayName: { contains: searchTerm, mode: "insensitive" },
        },
        select: {
          id: true,
          displayName: true,
          title: true,
          photo: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        take: limit,
      });
    }

    // Search services
    if (!type || type === "services") {
      const services = await prisma.service.findMany({
        where: {
          businessId: ctx.businessId,
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
          category: { select: { name: true } },
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
          businessId: ctx.businessId,
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
          category: { select: { name: true } },
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
      results.appointments = await prisma.appointment.findMany({
        where: {
          businessId: ctx.businessId,
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
          client: { select: { firstName: true, lastName: true } },
          staff: { select: { displayName: true } },
        },
        take: limit,
        orderBy: { scheduledStart: "desc" },
      });
    }

    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    return { query, totalResults, results };
  });
}
