import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PLAN_CONFIG = {
  STARTER: { price: 0, commission: 20 },
  GROWTH: { price: 49, commission: 12 },
  PRO: { price: 149, commission: 5 },
};

// POST /api/all-subscriptions - Create a new subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, email, phone, address, city, state, zipCode, businessType, plan } = body;

    if (!businessName || !email || !businessType || !plan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Create business and subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the business
      const business = await tx.business.create({
        data: {
          name: businessName,
          email: email,
          phone: phone || "",
          type: businessType,
          address: address || "",
          city: city || "",
          state: state || "",
          zipCode: zipCode || "",
          country: "US",
        },
      });

      // Create the subscription
      const subscription = await tx.businessSubscription.create({
        data: {
          businessId: business.id,
          plan: plan,
          status: "ACTIVE",
          monthlyPrice: planConfig.price,
          marketplaceCommissionPct: planConfig.commission,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Create a public profile with unique slug
      const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const uniqueSuffix = Date.now().toString(36);
      const slug = `${baseSlug}-${uniqueSuffix}`;
      await tx.publicSalonProfile.create({
        data: {
          businessId: business.id,
          slug: slug,
          isListed: true,
          specialties: [],
          amenities: [],
          galleryImages: [],
        },
      });

      return { business, subscription };
    });

    return NextResponse.json({
      subscription: {
        id: result.subscription.id,
        businessName: result.business.name,
        businessType: result.business.type,
        email: result.business.email,
        plan: result.subscription.plan,
        status: result.subscription.status,
        monthlyPrice: Number(result.subscription.monthlyPrice),
        commissionRate: Number(result.subscription.marketplaceCommissionPct),
        trialEndsAt: result.subscription.trialEndsAt,
        currentPeriodEnd: result.subscription.currentPeriodEnd,
        invoiceCount: 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/all-subscriptions - Get all subscriptions
export async function GET(request: NextRequest) {
  try {
    const subscriptions = await prisma.businessSubscription.findMany({
      include: {
        business: {
          select: {
            name: true,
            type: true,
            email: true,
          }
        }
      },
      orderBy: { monthlyPrice: "desc" }
    });

    // Get invoice counts per subscription
    const invoiceCounts = await prisma.businessInvoice.groupBy({
      by: ['subscriptionId'],
      _count: true,
    });

    const invoiceMap = Object.fromEntries(
      invoiceCounts.map(ic => [ic.subscriptionId, ic._count])
    );

    return NextResponse.json({
      total: subscriptions.length,
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        businessName: s.business.name,
        businessType: s.business.type,
        email: s.business.email,
        plan: s.plan,
        status: s.status,
        monthlyPrice: Number(s.monthlyPrice),
        commissionRate: Number(s.marketplaceCommissionPct),
        trialEndsAt: s.trialEndsAt,
        currentPeriodEnd: s.currentPeriodEnd,
        invoiceCount: invoiceMap[s.id] || 0,
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
