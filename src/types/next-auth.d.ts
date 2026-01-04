import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      businessId: string | null;
      businessName: string | null;
      staffId: string | null;
      clientId: string | null;
      firstName: string;
      lastName: string;
      isPlatformAdmin: boolean;
      isClient: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    businessId: string | null;
    businessName: string | null;
    staffId: string | null;
    clientId: string | null;
    firstName: string;
    lastName: string;
    isPlatformAdmin: boolean;
    isClient: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    businessId: string | null;
    businessName: string | null;
    staffId: string | null;
    clientId: string | null;
    firstName: string;
    lastName: string;
    isPlatformAdmin: boolean;
    isClient: boolean;
  }
}
