import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clients/family - Get family groups or search family members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const familyId = searchParams.get("familyId");

    if (familyId) {
      // Get all members of a family
      const family = await prisma.familyGroup.findUnique({
        where: { id: familyId },
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
        return NextResponse.json(
          { error: "Family not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: family.id,
        name: family.name,
        primaryContactId: family.primaryContactId,
        members: family.members.map((m) => ({
          ...m.client,
          relationship: m.relationship,
          isPrimaryContact: m.client.id === family.primaryContactId,
        })),
      });
    }

    if (clientId) {
      // Get family for a specific client
      const membership = await prisma.familyMember.findFirst({
        where: { clientId },
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
        return NextResponse.json({ family: null });
      }

      return NextResponse.json({
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
      });
    }

    // List all family groups
    const families = await prisma.familyGroup.findMany({
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching family:", error);
    return NextResponse.json(
      { error: "Failed to fetch family" },
      { status: 500 }
    );
  }
}

// POST /api/clients/family - Create a new family group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, primaryContactId, members } = body;

    if (!name || !primaryContactId) {
      return NextResponse.json(
        { error: "name and primaryContactId are required" },
        { status: 400 }
      );
    }

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
            ...(members || []).map(
              (m: { clientId: string; relationship: string }) => ({
                clientId: m.clientId,
                relationship: m.relationship,
              })
            ),
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

    return NextResponse.json({
      success: true,
      family: {
        id: family.id,
        name: family.name,
        members: family.members.map((m) => ({
          ...m.client,
          relationship: m.relationship,
        })),
      },
    });
  } catch (error) {
    console.error("Error creating family:", error);
    return NextResponse.json(
      { error: "Failed to create family" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/family - Update family or add/remove members
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { familyId, action, name, primaryContactId, clientId, relationship } = body;

    if (!familyId) {
      return NextResponse.json(
        { error: "familyId is required" },
        { status: 400 }
      );
    }

    if (action === "addMember") {
      if (!clientId || !relationship) {
        return NextResponse.json(
          { error: "clientId and relationship are required" },
          { status: 400 }
        );
      }

      // Check if client is already in a family
      const existingMembership = await prisma.familyMember.findFirst({
        where: { clientId },
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: "Client is already in a family group" },
          { status: 400 }
        );
      }

      await prisma.familyMember.create({
        data: {
          familyId,
          clientId,
          relationship,
        },
      });

      return NextResponse.json({ success: true, message: "Member added" });
    }

    if (action === "removeMember") {
      if (!clientId) {
        return NextResponse.json(
          { error: "clientId is required" },
          { status: 400 }
        );
      }

      // Check if this is the primary contact
      const family = await prisma.familyGroup.findUnique({
        where: { id: familyId },
      });

      if (family?.primaryContactId === clientId) {
        return NextResponse.json(
          { error: "Cannot remove primary contact. Update primary contact first." },
          { status: 400 }
        );
      }

      await prisma.familyMember.deleteMany({
        where: {
          familyId,
          clientId,
        },
      });

      return NextResponse.json({ success: true, message: "Member removed" });
    }

    // Update family details
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (primaryContactId) updateData.primaryContactId = primaryContactId;

    const family = await prisma.familyGroup.update({
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

    return NextResponse.json({
      success: true,
      family: {
        id: family.id,
        name: family.name,
        primaryContactId: family.primaryContactId,
        members: family.members.map((m) => ({
          ...m.client,
          relationship: m.relationship,
        })),
      },
    });
  } catch (error) {
    console.error("Error updating family:", error);
    return NextResponse.json(
      { error: "Failed to update family" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/family - Delete a family group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get("familyId");

    if (!familyId) {
      return NextResponse.json(
        { error: "familyId is required" },
        { status: 400 }
      );
    }

    // Delete all members first
    await prisma.familyMember.deleteMany({
      where: { familyId },
    });

    // Delete the family group
    await prisma.familyGroup.delete({
      where: { id: familyId },
    });

    return NextResponse.json({ success: true, message: "Family group deleted" });
  } catch (error) {
    console.error("Error deleting family:", error);
    return NextResponse.json(
      { error: "Failed to delete family" },
      { status: 500 }
    );
  }
}
