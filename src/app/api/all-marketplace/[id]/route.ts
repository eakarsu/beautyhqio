import { NextRequest } from "next/server";
import { context, endpoint, fail } from "@/lib/operations/core";
import { prisma } from "@/lib/prisma";

// DELETE /api/all-marketplace/[id] - Delete a marketplace profile.
//
// Destructive, tenant-internal mutation: only the owning business (or a platform
// administrator) may delete a profile.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    const { id } = await params;

    const profile = await prisma.publicSalonProfile.findFirst({
      where: ctx.user.isPlatformAdmin ? { id } : { id, businessId: ctx.businessId },
      select: { id: true },
    });
    if (!profile) return fail(404, "Not found");

    await prisma.publicSalonProfile.delete({ where: { id: profile.id } });

    return { success: true };
  });
}
