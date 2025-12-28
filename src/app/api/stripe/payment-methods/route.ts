import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-12-15.clover",
  });
}

// Helper to get user from either web session or mobile JWT
async function getAuthenticatedUser(request: NextRequest, method?: string) {
  // First try web session (NextAuth)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    console.log(`[${method}] Auth: Found web session for ${session.user.email}`);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { business: true },
    });
    return user;
  }

  // If no web session, try mobile JWT token
  const authHeader = request.headers.get("authorization");
  console.log(`[${method}] Auth: No web session, checking JWT. Header present: ${!!authHeader}`);

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; businessId: string };
      console.log(`[${method}] Auth: JWT verified for userId ${decoded.userId}`);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { business: true },
      });
      if (!user) {
        console.log(`[${method}] Auth: User not found in database for userId ${decoded.userId}`);
      }
      return user;
    } catch (err) {
      console.log(`[${method}] Auth: JWT verification failed:`, err);
      return null;
    }
  }

  console.log(`[${method}] Auth: No valid auth found`);
  return null;
}

// GET - List all saved payment methods
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request, "GET");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user?.business?.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    const stripe = getStripe();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.business.stripeCustomerId,
      type: "card",
    });

    // Format payment methods for frontend
    const formattedMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: false,
    }));

    return NextResponse.json({ paymentMethods: formattedMethods });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}

// POST - Create a SetupIntent for securely adding a payment method
// The client will use Stripe SDK to confirm the SetupIntent
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request, "POST");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripe();

    // Create or get Stripe customer
    let stripeCustomerId = user.business?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
          businessId: user.business?.id || "",
        },
      });
      stripeCustomerId = customer.id;

      // Update business with Stripe customer ID
      if (user.business) {
        await prisma.business.update({
          where: { id: user.business.id },
          data: { stripeCustomerId: customer.id },
        });
      }
    }

    // Create a SetupIntent - this is the PCI-compliant way to save cards
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      usage: "off_session", // Allow charging later without customer present
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomerId,
    });
  } catch (error: any) {
    console.error("Error creating setup intent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create setup intent" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a payment method
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request, "DELETE");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID required" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing payment method:", error);
    return NextResponse.json(
      { error: "Failed to remove payment method" },
      { status: 500 }
    );
  }
}
