import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { endpoint, fail, salesPipelineContext } from "@/lib/operations/core";

// NOTE: Lead is a platform-level sales pipeline table and has no businessId, so
// these handlers authenticate + role-gate but cannot tenant-scope. See report.
const leadUpdate = z
  .object({
    salonName: z.string().trim().min(1).max(200),
    ownerName: z.string().trim().min(1).max(200),
    phone: z.string().trim().min(1).max(50),
    email: z.union([z.string().trim().email().max(200), z.literal("")]).optional().nullable(),
    website: z.string().trim().max(500).optional().nullable(),
    address: z.string().trim().max(500).optional().nullable(),
    city: z.string().trim().max(120).optional().nullable(),
    state: z.string().trim().max(120).optional().nullable(),
    zip: z.string().trim().max(30).optional().nullable(),
    source: z.enum([
      "GOOGLE_MAPS",
      "YELP",
      "REFERRAL",
      "WALK_IN",
      "TRADE_SHOW",
      "COLD_CALL",
      "WEBSITE",
      "SOCIAL_MEDIA",
      "OTHER",
    ]),
    status: z.enum([
      "NEW",
      "CONTACTED",
      "DEMO_SCHEDULED",
      "DEMO_COMPLETED",
      "TRIAL",
      "NEGOTIATING",
      "CONVERTED",
      "LOST",
    ]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    notes: z.string().max(5000).optional().nullable(),
    lastContactAt: z.string().optional().nullable(),
    nextFollowUp: z.string().optional().nullable(),
    convertedAt: z.string().optional().nullable(),
    lostReason: z.string().max(2000).optional().nullable(),
  })
  .partial();

// GET /api/crm/leads/[id] - Get a single lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    await salesPipelineContext();
    const { id } = await params;

    const lead = await prisma.lead.findFirst({ where: { id } });
    if (!lead) fail(404, "Lead not found");

    return lead;
  });
}

// PUT /api/crm/leads/[id] - Update a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    await salesPipelineContext();
    const { id } = await params;
    const body = leadUpdate.parse(await request.json());

    const existing = await prisma.lead.findFirst({ where: { id }, select: { id: true } });
    if (!existing) fail(404, "Lead not found");

    const data = {
      ...body,
      ...(body.nextFollowUp !== undefined && {
        nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
      }),
      ...(body.lastContactAt !== undefined && {
        lastContactAt: body.lastContactAt ? new Date(body.lastContactAt) : null,
      }),
      ...(body.convertedAt !== undefined && {
        convertedAt: body.convertedAt ? new Date(body.convertedAt) : null,
      }),
    } as Prisma.LeadUpdateInput;

    // If status is changing to CONVERTED, set convertedAt
    if (body.status === "CONVERTED" && !body.convertedAt) {
      data.convertedAt = new Date();
    }

    return prisma.lead.update({ where: { id }, data });
  });
}

// DELETE /api/crm/leads/[id] - Delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endpoint(async () => {
    await salesPipelineContext();
    const { id } = await params;

    const result = await prisma.lead.deleteMany({ where: { id } });
    if (!result.count) fail(404, "Lead not found");

    return { success: true };
  });
}
