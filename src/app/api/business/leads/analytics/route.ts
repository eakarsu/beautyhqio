import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/business/leads/analytics - Get lead analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });

    if (!user?.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "month"; // day, week, month, year

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Get all leads for the period
    const leads = await prisma.marketplaceLead.findMany({
      where: {
        businessId: user.business.id,
        createdAt: { gte: startDate },
      },
    });

    // Calculate metrics
    const totalLeads = leads.length;
    const viewedLeads = leads.filter((l) => l.status !== "NEW").length;
    const bookedLeads = leads.filter((l) =>
      ["BOOKED", "COMPLETED", "NO_SHOW"].includes(l.status)
    ).length;
    const completedLeads = leads.filter((l) => l.status === "COMPLETED").length;
    const cancelledLeads = leads.filter((l) => l.status === "CANCELLED").length;
    const noShowLeads = leads.filter((l) => l.status === "NO_SHOW").length;

    // Commission totals
    const totalCommission = leads
      .filter((l) => l.commissionAmount)
      .reduce((sum, l) => sum + Number(l.commissionAmount || 0), 0);

    const paidCommission = leads
      .filter((l) => l.commissionPaidAt)
      .reduce((sum, l) => sum + Number(l.commissionAmount || 0), 0);

    const pendingCommission = totalCommission - paidCommission;

    // Conversion rates
    const viewToBookRate = viewedLeads > 0 ? (bookedLeads / viewedLeads) * 100 : 0;
    const bookToCompleteRate = bookedLeads > 0 ? (completedLeads / bookedLeads) * 100 : 0;
    const overallConversionRate = totalLeads > 0 ? (completedLeads / totalLeads) * 100 : 0;

    // Group by source
    const bySource = leads.reduce((acc, lead) => {
      const source = lead.source;
      if (!acc[source]) {
        acc[source] = { count: 0, booked: 0, completed: 0, commission: 0 };
      }
      acc[source].count++;
      if (["BOOKED", "COMPLETED", "NO_SHOW"].includes(lead.status)) {
        acc[source].booked++;
      }
      if (lead.status === "COMPLETED") {
        acc[source].completed++;
        acc[source].commission += Number(lead.commissionAmount || 0);
      }
      return acc;
    }, {} as Record<string, { count: number; booked: number; completed: number; commission: number }>);

    // Group by day for chart
    const dailyData = leads.reduce((acc, lead) => {
      const date = lead.createdAt.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { views: 0, bookings: 0, completions: 0 };
      }
      acc[date].views++;
      if (["BOOKED", "COMPLETED", "NO_SHOW"].includes(lead.status)) {
        acc[date].bookings++;
      }
      if (lead.status === "COMPLETED") {
        acc[date].completions++;
      }
      return acc;
    }, {} as Record<string, { views: number; bookings: number; completions: number }>);

    return NextResponse.json({
      period,
      startDate,
      endDate: now,
      overview: {
        totalLeads,
        viewedLeads,
        bookedLeads,
        completedLeads,
        cancelledLeads,
        noShowLeads,
      },
      commission: {
        total: Math.round(totalCommission * 100) / 100,
        paid: Math.round(paidCommission * 100) / 100,
        pending: Math.round(pendingCommission * 100) / 100,
      },
      conversionRates: {
        viewToBook: Math.round(viewToBookRate * 10) / 10,
        bookToComplete: Math.round(bookToCompleteRate * 10) / 10,
        overall: Math.round(overallConversionRate * 10) / 10,
      },
      bySource: Object.entries(bySource).map(([source, data]) => ({
        source,
        ...data,
        commission: Math.round(data.commission * 100) / 100,
      })),
      dailyData: Object.entries(dailyData)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    console.error("Error fetching lead analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
