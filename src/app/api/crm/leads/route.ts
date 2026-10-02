import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { endpoint, fail, idSchema, salesPipelineContext } from "@/lib/operations/core";

const leadSources = [
  "GOOGLE_MAPS",
  "YELP",
  "REFERRAL",
  "WALK_IN",
  "TRADE_SHOW",
  "COLD_CALL",
  "WEBSITE",
  "SOCIAL_MEDIA",
  "OTHER",
] as const;
const leadStatuses = [
  "NEW",
  "CONTACTED",
  "DEMO_SCHEDULED",
  "DEMO_COMPLETED",
  "TRIAL",
  "NEGOTIATING",
  "CONVERTED",
  "LOST",
] as const;
const leadPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const sourceSchema = z.enum(leadSources);
const statusSchema = z.enum(leadStatuses);
const prioritySchema = z.enum(leadPriorities);
const optionalEmail = z
  .union([z.string().trim().email().max(200), z.literal("")])
  .optional()
  .nullable();

// NOTE: Lead is a platform-level sales pipeline table and has no businessId, so
// these handlers authenticate + role-gate but cannot tenant-scope. See report.
const leadFields = z.object({
  salonName: z.string().trim().min(1).max(200),
  ownerName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(50),
  email: optionalEmail,
  website: z.string().trim().max(500).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  state: z.string().trim().max(120).optional().nullable(),
  zip: z.string().trim().max(30).optional().nullable(),
  source: sourceSchema,
  status: statusSchema,
  priority: prioritySchema,
  notes: z.string().max(5000).optional().nullable(),
  lastContactAt: z.string().optional().nullable(),
  nextFollowUp: z.string().optional().nullable(),
  convertedAt: z.string().optional().nullable(),
  lostReason: z.string().max(2000).optional().nullable(),
});

// GET /api/crm/leads - Get all leads
export async function GET(request: NextRequest) {
  return endpoint(async () => {
    await salesPipelineContext();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const sourceParam = searchParams.get("source");
    const priorityParam = searchParams.get("priority");

    const where: Prisma.LeadWhereInput = {
      ...(statusParam && { status: statusSchema.parse(statusParam) }),
      ...(sourceParam && { source: sourceSchema.parse(sourceParam) }),
      ...(priorityParam && { priority: prioritySchema.parse(priorityParam) }),
    };

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

    return { leads, stats };
  });
}

// POST /api/crm/leads - Create a new lead
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    await salesPipelineContext();
    const input = leadFields.parse(await request.json());

    const lead = await prisma.lead.create({
      data: {
        salonName: input.salonName,
        ownerName: input.ownerName,
        phone: input.phone,
        email: input.email || null,
        website: input.website || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        zip: input.zip || null,
        source: input.source,
        priority: input.priority,
        notes: input.notes || null,
        nextFollowUp: input.nextFollowUp ? new Date(input.nextFollowUp) : null,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  });
}

// PATCH /api/crm/leads - Update a lead
export async function PATCH(request: NextRequest) {
  return endpoint(async () => {
    await salesPipelineContext();
    const input = leadFields.partial().extend({ id: idSchema }).parse(await request.json());
    const { id, ...rest } = input;

    const existing = await prisma.lead.findFirst({ where: { id }, select: { id: true } });
    if (!existing) fail(404, "Lead not found");

    const data = {
      ...rest,
      ...(rest.nextFollowUp !== undefined && {
        nextFollowUp: rest.nextFollowUp ? new Date(rest.nextFollowUp) : null,
      }),
      ...(rest.lastContactAt !== undefined && {
        lastContactAt: rest.lastContactAt ? new Date(rest.lastContactAt) : null,
      }),
      ...(rest.convertedAt !== undefined && {
        convertedAt: rest.convertedAt ? new Date(rest.convertedAt) : null,
      }),
    } as Prisma.LeadUpdateInput;

    // If status is changing to CONVERTED, set convertedAt
    if (rest.status === "CONVERTED" && !rest.convertedAt) {
      data.convertedAt = new Date();
    }

    const lead = await prisma.lead.update({ where: { id }, data });

    return { lead };
  });
}

// DELETE /api/crm/leads - Delete a lead
export async function DELETE(request: NextRequest) {
  return endpoint(async () => {
    await salesPipelineContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) fail(400, "Lead ID is required");

    const result = await prisma.lead.deleteMany({ where: { id } });
    if (!result.count) fail(404, "Lead not found");

    return { success: true };
  });
}
