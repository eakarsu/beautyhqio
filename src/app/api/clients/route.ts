import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// Helper to get user from either web session or mobile JWT
async function getAuthenticatedUser(request: NextRequest) {
  // First try web session (NextAuth)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });
    return user;
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
      return user;
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
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const tag = searchParams.get("tag");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

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
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
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
    } = body;

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
  } catch (error: any) {
    console.error("Error creating client:", error);

    // Handle unique constraint error (e.g., duplicate email)
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "email";
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
