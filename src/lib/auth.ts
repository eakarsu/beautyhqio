import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import AppleProvider from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

// Roles that require email/password login (no OAuth)
const STAFF_ROLES = ["PLATFORM_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST", "STAFF"];

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth (for CLIENTS only)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // Microsoft OAuth (for CLIENTS only)
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: "common",
    }),
    // Apple OAuth (for CLIENTS only)
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || "",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "",
    }),
    // Email/Password credentials (for ALL users)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            business: true,
            staff: true,
            client: true,
          },
        });

        if (!user || !user.isActive) {
          throw new Error("Invalid credentials");
        }

        if (!user.password) {
          throw new Error("Please sign in with your social account");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          businessId: user.businessId || null,
          businessName: user.business?.name || null,
          staffId: user.staff?.id || null,
          clientId: user.client?.id || null,
          avatar: user.avatar,
          isPlatformAdmin: user.role === "PLATFORM_ADMIN",
          isClient: user.role === "CLIENT",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers (Google, Microsoft, Apple)
      if (account?.provider && account.provider !== "credentials") {
        const email = user.email;
        if (!email) return false;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // If existing user is STAFF/OWNER/etc, block OAuth login
          if (STAFF_ROLES.includes(existingUser.role)) {
            throw new Error("Staff members must use email and password to login");
          }
          // Allow OAuth for existing CLIENT users
          return true;
        }

        // New user via OAuth - create as CLIENT
        const nameParts = (user.name || "User").split(" ");
        const firstName = nameParts[0] || "User";
        const lastName = nameParts.slice(1).join(" ") || "";

        const newUser = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            role: "CLIENT",
            avatar: user.image || null,
            emailVerified: new Date(),
            // No businessId - clients don't belong to a specific business
          },
        });

        // Link the OAuth account
        await prisma.account.create({
          data: {
            userId: newUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state as string | null,
          },
        });

        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // For OAuth sign-ins, fetch user data from database
      if (account && account.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          include: { business: true, staff: true, client: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.businessId = dbUser.businessId || null;
          token.businessName = dbUser.business?.name || null;
          token.staffId = dbUser.staff?.id || null;
          token.clientId = dbUser.client?.id || null;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.isPlatformAdmin = dbUser.role === "PLATFORM_ADMIN";
          token.isClient = dbUser.role === "CLIENT";
        }
      } else if (user) {
        // For credentials sign-in
        token.id = user.id;
        token.role = user.role;
        token.businessId = user.businessId;
        token.businessName = user.businessName;
        token.staffId = user.staffId;
        token.clientId = user.clientId;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isPlatformAdmin = user.isPlatformAdmin;
        token.isClient = user.isClient;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.businessId = token.businessId as string | null;
        session.user.businessName = token.businessName as string | null;
        session.user.staffId = token.staffId as string | null;
        session.user.clientId = token.clientId as string | null;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.isPlatformAdmin = token.isPlatformAdmin as boolean;
        session.user.isClient = token.isClient as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
