import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint, fail, idSchema } from "@/lib/operations/core";

// FamilyGroup/FamilyMember have no businessId; membership is scoped through
// the related Client. Always require that at least one member belongs to the
// caller's business and that every referenced client id is in the tenant.
const familyScope = (businessId: string) => ({
  members: { some: { client: { businessId } } },
});

const memberSchema = z.object({
  clientId: idSchema,
  relationship: z.string().trim().min(1).max(100),
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(150),
  primaryContactId: idSchema,
  members: z.array(memberSchema).max(100).optional(),
});

const updateSchema = z.object({
  familyId: idSchema,
  action: z.enum(["addMember", "removeMember"]).optional(),
  name: z.string().trim().min(1).max(150).optional(),
  primaryContactId: idSchema.optional(),
  clientId: idSchema.optional(),
  relationship: z.string().trim().min(1).max(100).optional(),
});

async function assertClientsInBusiness(clientIds: string[], businessId: string) {
  const unique = [...new Set(clientIds)];
  const found = await prisma.client.count({
    where: { id: { in: unique }, businessId },
  });
  if (found !== unique.length) fail(422, "One or more clients do not belong to this business");
}

// GET /api/clients/family - Get family groups or search family members
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { searchParams } = new URL(request.url);
    const clientId = idSchema.optional().parse(searchParams.get("clientId") || undefined);
    const familyId = idSchema.optional().parse(searchParams.get("familyId") || undefined);

    if (familyId) {
      // Get all members of a family
      const family = await prisma.familyGroup.findFirst({
        where: { id: familyId, ...familyScope(ctx.businessId) },
        include: {
          members: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!family) {
        fail(404, "Family not found");
      }

      return {
        id: family.id,
        name: family.name,
        primaryContactId: family.primaryContactId,
        members: family.members.map((m) => ({
          ...m.client,
          relationship: m.relationship,
          isPrimaryContact: m.client.id === family.primaryContactId,
        })),
      };
    }

    if (clientId) {
      // Get family for a specific client
      const membership = await prisma.familyMember.findFirst({
        where: { clientId, client: { businessId: ctx.businessId } },
        include: {
          family: {
            include: {
              members: {
                include: {
                  client: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!membership) {
        return { family: null };
      }

      return {
        family: {
          id: membership.family.id,
          name: membership.family.name,
          primaryContactId: membership.family.primaryContactId,
          relationship: membership.relationship,
          members: membership.family.members.map((m) => ({
            ...m.client,
            relationship: m.relationship,
            isPrimaryContact: m.client.id === membership.family.primaryContactId,
          })),
        },
      };
    }

    // List all family groups
    const families = await prisma.familyGroup.findMany({
      where: familyScope(ctx.businessId),
      include: {
        members: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        primaryContact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      families: families.map((f) => ({
        id: f.id,
        name: f.name,
        primaryContact: f.primaryContact
          ? `${f.primaryContact.firstName} ${f.primaryContact.lastName}`
          : null,
        memberCount: f.members.length,
        members: f.members.map(
          (m) => `${m.client.firstName} ${m.client.lastName}`
        ),
      })),
    };
  });
}

// POST /api/clients/family - Create a new family group
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { name, primaryContactId, members } = createSchema.parse(
      await request.json()
    );

    await assertClientsInBusiness(
      [primaryContactId, ...(members || []).map((m) => m.clientId)],
      ctx.businessId
    );

    // Create family group
    const family = await prisma.familyGroup.create({
      data: {
        name,
        primaryContactId,
        members: {
          create: [
            {
              clientId: primaryContactId,
              relationship: "Primary",
            },
            ...(members || []).map((m) => ({
              clientId: m.clientId,
              relationship: m.relationship,
            })),
          ],
        },
      },
      include: {
        members: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      family: {
        id: family.id,
        name: family.name,
        members: family.members.map((m) => ({
          ...m.client,
          relationship: m.relationship,
        })),
      },
    };
  });
}

// PUT /api/clients/family - Update family or add/remove members
export async function PUT(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { familyId, action, name, primaryContactId, clientId, relationship } =
      updateSchema.parse(await request.json());

    const family = await prisma.familyGroup.findFirst({
      where: { id: familyId, ...familyScope(ctx.businessId) },
      select: { id: true, primaryContactId: true },
    });
    if (!family) fail(404, "Family not found");

    if (action === "addMember") {
      if (!clientId || !relationship) {
        fail(422, "clientId and relationship are required");
      }
      await assertClientsInBusiness([clientId], ctx.businessId);

      // Check if client is already in a family
      const existingMembership = await prisma.familyMember.findFirst({
        where: { clientId, client: { businessId: ctx.businessId } },
      });

      if (existingMembership) {
        fail(400, "Client is already in a family group");
      }

      await prisma.familyMember.create({
        data: {
          familyId,
          clientId,
          relationship,
        },
      });

      return { success: true, message: "Member added" };
    }

    if (action === "removeMember") {
      if (!clientId) {
        fail(422, "clientId is required");
      }

      // Check if this is the primary contact
      if (family.primaryContactId === clientId) {
        fail(400, "Cannot remove primary contact. Update primary contact first.");
      }

      await prisma.familyMember.deleteMany({
        where: {
          familyId,
          clientId,
        },
      });

      return { success: true, message: "Member removed" };
    }

    // Update family details
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (primaryContactId) {
      await assertClientsInBusiness([primaryContactId], ctx.businessId);
      updateData.primaryContactId = primaryContactId;
    }

    const updated = await prisma.familyGroup.update({
      where: { id: familyId },
      data: updateData,
      include: {
        members: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      family: {
        id: updated.id,
        name: updated.name,
        primaryContactId: updated.primaryContactId,
        members: updated.members.map((m) => ({
          ...m.client,
          relationship: m.relationship,
        })),
      },
    };
  });
}

// DELETE /api/clients/family - Delete a family group
export async function DELETE(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST"]);
    const { searchParams } = new URL(request.url);
    const familyId = z
      .string()
      .trim()
      .min(1)
      .max(191)
      .parse(searchParams.get("familyId") || undefined);

    const family = await prisma.familyGroup.findFirst({
      where: { id: familyId, ...familyScope(ctx.businessId) },
      select: { id: true },
    });
    if (!family) fail(404, "Family not found");

    // Delete all members first
    await prisma.familyMember.deleteMany({
      where: { familyId },
    });

    // Delete the family group
    await prisma.familyGroup.delete({
      where: { id: familyId },
    });

    return { success: true, message: "Family group deleted" };
  });
}
