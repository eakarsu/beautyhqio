import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/clients/[id] - Get client profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { scheduledStart: "desc" },
          take: 10,
          include: {
            services: {
              include: { service: true },
            },
            staff: {
              include: { user: true },
            },
          },
        },
        photos: {
          orderBy: { takenAt: "desc" },
          take: 20,
        },
        formulas: {
          orderBy: { lastUsed: "desc" },
        },
        preferences: true,
        loyaltyAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
        transactions: {
          orderBy: { date: "desc" },
          take: 10,
          include: {
            lineItems: true,
            payments: true,
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        clientNotes: {
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Calculate stats
    const totalSpent = client.transactions.reduce(
      (sum, t) => sum + Number(t.totalAmount),
      0
    );
    const totalVisits = client.appointments.filter(
      (a) => a.status === "COMPLETED"
    ).length;

    return NextResponse.json({
      ...client,
      totalSpent,
      totalVisits,
      avgTicket: totalVisits > 0 ? totalSpent / totalVisits : 0,
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Parse birthday if provided
    let birthdayData = {};
    if (body.birthday) {
      const birthdayDate = new Date(body.birthday);
      birthdayData = {
        birthday: birthdayDate,
        birthdayMonth: birthdayDate.getMonth() + 1,
        birthdayDay: birthdayDate.getDate(),
      };
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        mobile: body.mobile,
        ...birthdayData,
        preferredLanguage: body.preferredLanguage,
        preferredStaffId: body.preferredStaffId,
        preferredContactMethod: body.preferredContactMethod,
        allowSms: body.allowSms,
        allowEmail: body.allowEmail,
        notes: body.notes,
        internalNotes: body.internalNotes,
        tags: body.tags,
        status: body.status,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: "PROFILE_UPDATED",
        title: "Profile updated",
        description: "Client information was updated",
        clientId: client.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete related records first (to avoid foreign key constraints)
    await prisma.activity.deleteMany({ where: { clientId: id } });
    await prisma.clientNote.deleteMany({ where: { clientId: id } });
    await prisma.attachment.deleteMany({ where: { clientId: id } });
    await prisma.clientPhoto.deleteMany({ where: { clientId: id } });
    await prisma.serviceFormula.deleteMany({ where: { clientId: id } });
    await prisma.clientPreference.deleteMany({ where: { clientId: id } });
    await prisma.review.deleteMany({ where: { clientId: id } });

    // Delete the client
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
