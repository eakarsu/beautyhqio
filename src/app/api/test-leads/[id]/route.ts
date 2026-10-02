import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail } from "@/lib/operations/core";

// NOTE: `/api/test-leads` appears to be a development leftover (the UI at
// /reports/leads consumes it). It is gated rather than deleted; see report.
// DELETE /api/test-leads/[id] - Delete a marketplace lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;

    const existing = await prisma.marketplaceLead.findFirst({
      where: { id, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!existing) fail(404, "Lead not found");

    await prisma.marketplaceLead.delete({ where: { id } });

    return { success: true };
  });
}
