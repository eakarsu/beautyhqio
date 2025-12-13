import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        userId: session.user.id,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
