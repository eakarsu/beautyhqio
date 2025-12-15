import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth (Gmail users)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    // Microsoft OAuth (Hotmail, Outlook users)
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: "common", // Allows any Microsoft account
      allowDangerousEmailAccountLinking: true,
    }),
    // Email/Password credentials
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
          businessId: user.businessId,
          businessName: user.business.name,
          staffId: user.staff?.id || null,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, check if user exists or create new one
      if (account?.provider && account.provider !== "credentials") {
        const email = user.email;
        if (!email) return false;

        let existingUser = await prisma.user.findUnique({
          where: { email },
          include: { business: true },
        });

        if (!existingUser) {
          // Create a default business for new OAuth users
          const business = await prisma.business.create({
            data: {
              name: `${user.name || "My"}'s Business`,
              type: "MULTI_SERVICE",
            },
          });

          // Extract first and last name from OAuth profile
          const nameParts = (user.name || "User").split(" ");
          const firstName = nameParts[0] || "User";
          const lastName = nameParts.slice(1).join(" ") || "";

          existingUser = await prisma.user.create({
            data: {
              email,
              firstName,
              lastName,
              role: "OWNER",
              businessId: business.id,
              avatar: user.image || null,
              emailVerified: new Date(),
            },
            include: { business: true },
          });
        }

        // Link the OAuth account to the user
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
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
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // For OAuth sign-ins, fetch user data from database
      if (account && account.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          include: { business: true, staff: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.businessId = dbUser.businessId;
          token.businessName = dbUser.business.name;
          token.staffId = dbUser.staff?.id || null;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
        }
      } else if (user) {
        // For credentials sign-in
        token.id = user.id;
        token.role = user.role;
        token.businessId = user.businessId;
        token.businessName = user.businessName;
        token.staffId = user.staffId;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.businessId = token.businessId as string;
        session.user.businessName = token.businessName as string;
        session.user.staffId = token.staffId as string | null;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
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
