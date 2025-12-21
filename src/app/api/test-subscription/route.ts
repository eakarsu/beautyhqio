import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/test-subscription - Test endpoint to see subscription directly
export async function GET(request: NextRequest) {
  try {
    // Get the first business (Luxe Beauty Studio)
    const business = await prisma.business.findFirst({
      where: { name: "Luxe Beauty Studio" },
      include: {
        subscription: true,
        publicProfile: true,
      }
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" });
    }

    // Get invoices
    const invoices = business.subscription ? await prisma.businessInvoice.findMany({
      where: { subscriptionId: business.subscription.id },
      orderBy: { createdAt: "desc" },
      take: 10
    }) : [];

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        type: business.type,
        email: business.email,
        phone: business.phone,
      },
      subscription: business.subscription ? {
        id: business.subscription.id,
        plan: business.subscription.plan,
        status: business.subscription.status,
        monthlyPrice: Number(business.subscription.monthlyPrice),
        commissionRate: Number(business.subscription.marketplaceCommissionPct),
        currentPeriodStart: business.subscription.currentPeriodStart,
        currentPeriodEnd: business.subscription.currentPeriodEnd,
        trialEndsAt: business.subscription.trialEndsAt,
      } : null,
      profile: business.publicProfile ? {
        id: business.publicProfile.id,
        slug: business.publicProfile.slug,
        isListed: business.publicProfile.isListed,
        headline: business.publicProfile.headline,
        description: business.publicProfile.description,
        specialties: business.publicProfile.specialties,
        amenities: business.publicProfile.amenities,
        priceRange: business.publicProfile.priceRange,
        avgRating: business.publicProfile.avgRating ? Number(business.publicProfile.avgRating) : null,
        reviewCount: business.publicProfile.reviewCount,
        viewCount: business.publicProfile.viewCount,
        bookingClickCount: business.publicProfile.bookingClickCount,
        isVerified: business.publicProfile.isVerified,
      } : null,
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        subscriptionAmount: Number(inv.subscriptionAmount),
        commissionAmount: Number(inv.commissionAmount),
        totalAmount: Number(inv.totalAmount),
        status: inv.status,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
