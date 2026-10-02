import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

// GET /api/locations/[id]/services - Get services for a location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const { id } = await params;

    // Verify the location belongs to the caller's business.
    const location = await prisma.location.findFirst({
      where: { id, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!location) return fail(404, "Location not found");

    const services = await prisma.service.findMany({
      where: {
        businessId: ctx.businessId,
        isActive: true,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });

    return services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: Number(service.price),
      categoryName: service.category?.name,
    }));
  });
}
