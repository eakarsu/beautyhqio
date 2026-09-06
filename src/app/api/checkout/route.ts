import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireRoles} from "@/lib/api-auth";
export {POST} from "@/app/api/operations/sales/route";
// GET /api/checkout - Get recent transactions
export async function GET(request: NextRequest) {
  try {
    const actor = await requireRoles(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    if (actor instanceof NextResponse) return actor;
    if (!actor.isPlatformAdmin && !actor.businessId) return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = actor.isPlatformAdmin ? {} : { location: { businessId: actor.businessId! } };
    if(actor.role==='STAFF')where.staffId=actor.staffId||'none';
    if (locationId) where.locationId = locationId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        lineItems: true,
        payments: true,
        client: true,
        staff: true,
        location: true,
      },
      orderBy: { date: "desc" },
      take: Math.min(500,Math.max(1,limit||50)),
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
