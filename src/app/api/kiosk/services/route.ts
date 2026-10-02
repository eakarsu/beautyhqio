import { NextRequest } from "next/server";
import { endpoint, fail } from "@/lib/operations/core";
import { resolveKioskLocation } from "@/lib/operations/kiosk-token";
import { prisma } from "@/lib/prisma";

// GET /api/kiosk/services
// Bookable services for the kiosk's own location. Previously the location was
// optional and an arbitrary "first active" business was used, so a kiosk could
// show another tenant's catalogue. Now requires a kiosk token bound to the
// location.
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const token = request.headers.get("x-kiosk-token");
    const location = await resolveKioskLocation(prisma, token);

    const services = await prisma.service.findMany({
      where: { businessId: location.businessId, isActive: true, allowOnline: true },
      include: { category: { select: { name: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      price: Number(s.price),
      category: s.category?.name || "Other",
    }));
  });
}
