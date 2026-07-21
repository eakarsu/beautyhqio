import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validation";
import { issueMobileSession } from "@/lib/mobile-session";

const requestSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: passwordSchema,
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().max(50).optional().default(""),
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  businessName: z.string().trim().min(2).max(120),
  businessType: z.enum(["HAIR_SALON", "BARBERSHOP", "NAIL_SALON", "SPA", "MASSAGE", "LASH_BROW", "WAXING", "TANNING", "MAKEUP", "WELLNESS", "MULTI_SERVICE"]).default("MULTI_SERVICE"),
});

function names(input: z.infer<typeof requestSchema>) {
  if (input.firstName) return { firstName: input.firstName, lastName: input.lastName };
  const parts = input.name!.split(/\s+/);
  return { firstName: parts.shift()!, lastName: parts.join(" ") };
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  const input = parsed.data;
  if (!input.firstName && !input.name) return NextResponse.json({ error: "Name is required" }, { status: 422 });
  if (await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }
  const person = names(input);
  const result = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({ data: { name: input.businessName, type: input.businessType } });
    await tx.businessSubscription.create({ data: { businessId: business.id, plan: "STARTER", status: "ACTIVE", monthlyPrice: 0, marketplaceCommissionPct: 20 } });
    await tx.publicSalonProfile.create({ data: { businessId: business.id, slug: `${input.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${randomUUID().slice(0, 8)}`, isListed: false, specialties: [], amenities: [], galleryImages: [] } });
    const user = await tx.user.create({ data: { email: input.email, password: await bcrypt.hash(input.password, 12), ...person, phone: input.phone, role: "OWNER", businessId: business.id } });
    await tx.auditLog.create({ data: { userId: user.id, businessId: business.id, action: "TENANT_REGISTERED", entityType: "Business", entityId: business.id } });
    const credentials = await issueMobileSession(tx, user);
    return { business, user, credentials };
  });
  return NextResponse.json({
    ...result.credentials,
    user: { id: result.user.id, email: result.user.email, name: `${result.user.firstName} ${result.user.lastName}`.trim(), phone: result.user.phone, image: result.user.avatar, role: result.user.role, businessId: result.business.id, staffId: null, isClient: false, createdAt: result.user.createdAt.toISOString(), updatedAt: result.user.updatedAt.toISOString() },
  }, { status: 201 });
}
