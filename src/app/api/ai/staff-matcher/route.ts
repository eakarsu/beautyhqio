import { NextRequest, NextResponse } from "next/server";
import { openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";

// POST /api/ai/staff-matcher - AI-powered staff matching for clients
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, serviceId, preferences } = body;

    if (!serviceId) {
      return NextResponse.json(
        { error: "serviceId is required" },
        { status: 400 }
      );
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        category: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Get available staff who can perform this service
    const staff = await prisma.staff.findMany({
      where: {
        isActive: true,
        isBookableOnline: true,
        OR: [
          { serviceIds: { has: serviceId } },
          { specialties: { hasSome: service.category ? [service.category.name] : [] } },
        ],
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Get client history if available
    let clientContext = "";
    let pastStaffIds: string[] = [];

    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          appointments: {
            where: { status: "COMPLETED" },
            orderBy: { scheduledStart: "desc" },
            take: 20,
            include: {
              staff: {
                select: { id: true, displayName: true },
              },
              services: {
                include: {
                  service: { select: { name: true, categoryId: true } },
                },
              },
            },
          },
          preferences: true,
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      if (client) {
        // Track which staff the client has seen
        pastStaffIds = client.appointments.map((a) => a.staffId);

        // Count staff frequency
        const staffFrequency: Record<string, number> = {};
        pastStaffIds.forEach((id) => {
          staffFrequency[id] = (staffFrequency[id] || 0) + 1;
        });

        const preferredStaffName =
          client.preferredStaffId &&
          staff.find((s) => s.id === client.preferredStaffId)?.displayName;

        clientContext = `
CLIENT PROFILE:
- Name: ${client.firstName} ${client.lastName}
- Preferred staff: ${preferredStaffName || "No preference set"}
- Visit history: ${client.appointments.length} total visits
- Staff they've seen most: ${Object.entries(staffFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id, count]) => {
            const s = staff.find((st) => st.id === id);
            return s ? `${s.displayName} (${count} visits)` : "";
          })
          .filter(Boolean)
          .join(", ")}
- Recent review ratings: ${client.reviews.map((r) => `${r.rating}/5`).join(", ") || "None"}
- Preferences: ${client.preferences.map((p) => `${p.category}: ${p.value}`).join(", ") || "None recorded"}
`;
      }
    }

    // Build staff profiles
    const staffProfiles = staff.map((s) => ({
      id: s.id,
      name: s.displayName || `${s.user.firstName} ${s.user.lastName}`,
      specialties: s.specialties,
      rating: s.avgRating ? Number(s.avgRating) : null,
      reviewCount: s.reviewCount,
      rebookRate: s.rebookRate ? Number(s.rebookRate) : null,
      clientHistory: pastStaffIds.filter((id) => id === s.id).length,
    }));

    const systemPrompt = `You are an AI staff matcher for a beauty & wellness salon. Match the best staff member for a client based on their preferences, history, and staff expertise.

SERVICE REQUESTED: ${service.name} (${service.category?.name || "General"})

AVAILABLE STAFF:
${staffProfiles
  .map(
    (s) => `- ${s.name}
  Specialties: ${s.specialties.join(", ") || "General"}
  Rating: ${s.rating?.toFixed(1) || "New"}/5 (${s.reviewCount} reviews)
  Rebook Rate: ${s.rebookRate ? `${s.rebookRate}%` : "N/A"}
  Past visits with client: ${s.clientHistory}`
  )
  .join("\n")}

${clientContext}

${preferences ? `CLIENT PREFERENCES FOR THIS BOOKING: ${preferences}` : ""}

INSTRUCTIONS:
Recommend the top 3 staff members in order of best match. Consider:
1. Expertise in the requested service
2. Past relationship with the client (if applicable)
3. Ratings and rebook rates
4. Client preferences

Respond in JSON format:
{
  "recommendations": [
    {
      "staffId": "id",
      "staffName": "name",
      "matchScore": 95,
      "reasons": ["reason 1", "reason 2"],
      "specialNote": "Optional personalized note"
    }
  ],
  "summary": "Brief explanation of the matching logic"
}`;

    const response = await openRouterChat([
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: "Please recommend the best staff for this client and service.",
      },
    ]);

    // Parse response
    let recommendations;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch {
      recommendations = {
        recommendations: staffProfiles.slice(0, 3).map((s, i) => ({
          staffId: s.id,
          staffName: s.name,
          matchScore: 90 - i * 5,
          reasons: ["Available for service", "Qualified"],
        })),
        summary: response,
      };
    }

    return NextResponse.json({
      service: {
        id: service.id,
        name: service.name,
        category: service.category?.name,
      },
      ...recommendations,
      availableStaff: staffProfiles,
    });
  } catch (error) {
    console.error("Error in staff matcher:", error);
    return NextResponse.json(
      { error: "Failed to match staff" },
      { status: 500 }
    );
  }
}
