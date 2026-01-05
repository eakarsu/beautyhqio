import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { authOptions } from "./auth";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export type UserRole = "PLATFORM_ADMIN" | "OWNER" | "MANAGER" | "RECEPTIONIST" | "STAFF" | "CLIENT";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  businessId: string | null;
  businessName: string | null;
  staffId: string | null;
  firstName: string;
  lastName: string;
  isPlatformAdmin: boolean;
}

/**
 * Get the authenticated user from session OR JWT token (for mobile)
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  // First try NextAuth session (web)
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email || "",
      role: session.user.role as UserRole,
      businessId: session.user.businessId,
      businessName: session.user.businessName,
      staffId: session.user.staffId,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      isPlatformAdmin: session.user.isPlatformAdmin,
    };
  }

  // Try JWT token from Authorization header (mobile)
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        businessId: string;
        role: string;
      };

      // Fetch full user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          business: true,
          staff: true,
        },
      });

      if (user) {
        return {
          id: user.id,
          email: user.email,
          role: user.role as UserRole,
          businessId: user.businessId,
          businessName: user.business?.name || null,
          staffId: user.staff?.id || null,
          firstName: user.firstName,
          lastName: user.lastName,
          isPlatformAdmin: user.role === "PLATFORM_ADMIN",
        };
      }
    }
  } catch (error) {
    // JWT verification failed, continue to return null
    console.error("JWT verification error:", error);
  }

  return null;
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return user;
}

/**
 * Require specific roles - returns 403 if user doesn't have required role
 */
export async function requireRoles(
  allowedRoles: UserRole[]
): Promise<AuthenticatedUser | NextResponse> {
  const result = await requireAuth();

  if (result instanceof NextResponse) {
    return result;
  }

  const user = result;

  // Platform admin has access to everything
  if (user.isPlatformAdmin) {
    return user;
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: "Forbidden - insufficient permissions" },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Get the businessId filter for queries
 * Platform admins can optionally filter by a specific businessId
 * Regular users are restricted to their own businessId
 */
export function getBusinessIdFilter(
  user: AuthenticatedUser,
  requestedBusinessId?: string | null
): string | null | undefined {
  // Platform admin can see all or filter by specific business
  if (user.isPlatformAdmin) {
    return requestedBusinessId || undefined; // undefined means no filter (see all)
  }

  // Regular users can only see their own business data
  return user.businessId;
}

/**
 * Check if user has access to a specific business
 */
export function canAccessBusiness(
  user: AuthenticatedUser,
  businessId: string
): boolean {
  if (user.isPlatformAdmin) {
    return true;
  }
  return user.businessId === businessId;
}

/**
 * Permissions by role
 */
export const ROLE_PERMISSIONS = {
  PLATFORM_ADMIN: {
    // Full access to everything
    canViewAllBusinesses: true,
    canManageSubscriptions: true,
    canViewPlatformRevenue: true,
    canManageUsers: true,
    canManageStaff: true,
    canManageClients: true,
    canManageServices: true,
    canManageProducts: true,
    canViewReports: true,
    canManageSettings: true,
    canProcessPayments: true,
    canManageMarketing: true,
  },
  OWNER: {
    canViewAllBusinesses: false,
    canManageSubscriptions: true,
    canViewPlatformRevenue: false,
    canManageUsers: true,
    canManageStaff: true,
    canManageClients: true,
    canManageServices: true,
    canManageProducts: true,
    canViewReports: true,
    canManageSettings: true,
    canProcessPayments: true,
    canManageMarketing: true,
  },
  MANAGER: {
    canViewAllBusinesses: false,
    canManageSubscriptions: false,
    canViewPlatformRevenue: false,
    canManageUsers: false,
    canManageStaff: true,
    canManageClients: true,
    canManageServices: true,
    canManageProducts: true,
    canViewReports: true,
    canManageSettings: false,
    canProcessPayments: true,
    canManageMarketing: true,
  },
  RECEPTIONIST: {
    canViewAllBusinesses: false,
    canManageSubscriptions: false,
    canViewPlatformRevenue: false,
    canManageUsers: false,
    canManageStaff: false,
    canManageClients: true,
    canManageServices: false,
    canManageProducts: false,
    canViewReports: false,
    canManageSettings: false,
    canProcessPayments: true,
    canManageMarketing: false,
  },
  STAFF: {
    canViewAllBusinesses: false,
    canManageSubscriptions: false,
    canViewPlatformRevenue: false,
    canManageUsers: false,
    canManageStaff: false,
    canManageClients: false, // Can only see own clients
    canManageServices: false,
    canManageProducts: false,
    canViewReports: false, // Can only see own reports
    canManageSettings: false,
    canProcessPayments: true, // For checkout
    canManageMarketing: false,
  },
  CLIENT: {
    canViewAllBusinesses: false,
    canManageSubscriptions: false,
    canViewPlatformRevenue: false,
    canManageUsers: false,
    canManageStaff: false,
    canManageClients: false,
    canManageServices: false,
    canManageProducts: false,
    canViewReports: false,
    canManageSettings: false,
    canProcessPayments: false,
    canManageMarketing: false,
  },
} as const;

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: AuthenticatedUser,
  permission: keyof typeof ROLE_PERMISSIONS.OWNER
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  return rolePermissions?.[permission] ?? false;
}
