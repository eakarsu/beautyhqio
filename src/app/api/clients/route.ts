import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { requireAuth, getBusinessIdFilter, AuthenticatedUser } from "@/lib/api-auth";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// Helper to get user from either web session or mobile JWT
async function getAuthenticatedUserLegacy(request: NextRequest) {
  // First try web session (NextAuth)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email!,
      role: session.user.role as AuthenticatedUser["role"],
      businessId: session.user.businessId,
      businessName: session.user.businessName,
      staffId: session.user.staffId,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      isPlatformAdmin: session.user.isPlatformAdmin,
    };
  }

  // If no web session, try mobile JWT token
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; businessId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { business: true },
      });
      if (user) {
        return {
          id: user.id,
          email: user.email,
          role: user.role as AuthenticatedUser["role"],
          businessId: user.businessId,
          businessName: user.business?.name || null,
          staffId: null,
          firstName: user.firstName,
          lastName: user.lastName,
          isPlatformAdmin: user.role === "PLATFORM_ADMIN",
        };
      }
    } catch {
      // Invalid token
      return null;
    }
  }

  return null;
}

// GET /api/clients - List clients with search and filters
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUserLegacy(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const tag = searchParams.get("tag");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Platform admin can optionally filter by a specific business
    const requestedBusinessId = searchParams.get("businessId");

    // Build where clause with business filtering
    const where: Record<string, unknown> = {};

    // Apply business filter based on user role
    const businessIdFilter = getBusinessIdFilter(user as AuthenticatedUser, requestedBusinessId);
    if (businessIdFilter) {
      where.businessId = businessIdFilter;
    }
    // If businessIdFilter is undefined (platform admin with no filter), show all clients

    // Search by name, email, or phone
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          business: {
            select: { id: true, name: true },
          },
          appointments: {
            take: 1,
            orderBy: { scheduledStart: "desc" },
            select: { scheduledStart: true },
          },
          transactions: {
            select: { totalAmount: true },
          },
          loyaltyAccount: {
            select: { pointsBalance: true, tier: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    // Calculate stats for each client
    const clientsWithStats = clients.map((client) => ({
      ...client,
      lastVisit: client.appointments[0]?.scheduledStart || null,
      totalVisits: client.appointments.length,
      totalSpent: client.transactions.reduce(
        (sum, t) => sum + Number(t.totalAmount),
        0
      ),
      loyaltyPoints: client.loyaltyAccount?.pointsBalance || 0,
      loyaltyTier: client.loyaltyAccount?.tier || "Bronze",
    }));

    return NextResponse.json({
      clients: clientsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserLegacy(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
    }

    // Non-platform-admin users must have a businessId
    if (!user.isPlatformAdmin && !user.businessId) {
      return NextResponse.json({ error: "No business associated with user" }, { status: 400 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      mobile,
      birthday,
      preferredLanguage,
      preferredContactMethod,
      allowSms,
      allowEmail,
      referralSource,
      notes,
      tags,
      businessId: requestedBusinessId, // Platform admin can specify which business
    } = body;

    // Determine which business this client belongs to
    let targetBusinessId = user.businessId;
    if (user.isPlatformAdmin && requestedBusinessId) {
      targetBusinessId = requestedBusinessId;
    }

    if (!targetBusinessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 }
      );
    }

    // Parse birthday
    let birthdayDate = null;
    let birthdayMonth = null;
    let birthdayDay = null;
    if (birthday) {
      birthdayDate = new Date(birthday);
      birthdayMonth = birthdayDate.getMonth() + 1;
      birthdayDay = birthdayDate.getDate();
    }

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        mobile,
        birthday: birthdayDate,
        birthdayMonth,
        birthdayDay,
        preferredLanguage: preferredLanguage || "en",
        preferredContactMethod: preferredContactMethod || "sms",
        allowSms: allowSms !== false,
        allowEmail: allowEmail !== false,
        referralSource,
        notes,
        tags: tags || [],
        businessId: targetBusinessId,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: "PROFILE_UPDATED",
        title: "Client created",
        description: `New client ${firstName} ${lastName} added`,
        clientId: client.id,
        userId: user.id,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating client:", error);

    // Handle unique constraint error (e.g., duplicate email)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const prismaError = error as { meta?: { target?: string[] } };
      const field = prismaError.meta?.target?.[0] || "email";
      return NextResponse.json(
        { error: `A client with this ${field} already exists.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
