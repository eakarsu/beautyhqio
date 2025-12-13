import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/crm/leads - Get all leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const priority = searchParams.get("priority");

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (source) {
      where.source = source;
    }
    if (priority) {
      where.priority = priority;
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { nextFollowUp: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Get stats
    const stats = {
      total: await prisma.lead.count(),
      new: await prisma.lead.count({ where: { status: "NEW" } }),
      contacted: await prisma.lead.count({ where: { status: "CONTACTED" } }),
      demoScheduled: await prisma.lead.count({ where: { status: "DEMO_SCHEDULED" } }),
      trial: await prisma.lead.count({ where: { status: "TRIAL" } }),
      converted: await prisma.lead.count({ where: { status: "CONVERTED" } }),
      lost: await prisma.lead.count({ where: { status: "LOST" } }),
    };

    return NextResponse.json({ leads, stats });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// POST /api/crm/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      salonName,
      ownerName,
      email,
      phone,
      website,
      address,
      city,
      state,
      zip,
      source,
      priority,
      notes,
      nextFollowUp,
    } = body;

    if (!salonName || !ownerName || !phone) {
      return NextResponse.json(
        { error: "Salon name, owner name, and phone are required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        salonName,
        ownerName,
        email,
        phone,
        website,
        address,
        city,
        state,
        zip,
        source: source || "OTHER",
        priority: priority || "MEDIUM",
        notes,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}

// PATCH /api/crm/leads - Update a lead
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }

    // Handle date conversion
    if (updateData.nextFollowUp) {
      updateData.nextFollowUp = new Date(updateData.nextFollowUp);
    }
    if (updateData.lastContactAt) {
      updateData.lastContactAt = new Date(updateData.lastContactAt);
    }

    // If status is changing to CONVERTED, set convertedAt
    if (updateData.status === "CONVERTED" && !updateData.convertedAt) {
      updateData.convertedAt = new Date();
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/leads - Delete a lead
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
