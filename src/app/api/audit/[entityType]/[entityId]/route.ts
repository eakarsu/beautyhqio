import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";

// GET /api/audit/[entityType]/[entityId] - Get audit history for an entity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.isPlatformAdmin && !["OWNER", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { entityType, entityId } = await params;

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
        ...(!user.isPlatformAdmin && { businessId: user.businessId }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      entityType,
      entityId,
      history: logs,
    });
  } catch (error) {
    console.error("Error fetching entity audit history:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit history" },
      { status: 500 }
    );
  }
}
