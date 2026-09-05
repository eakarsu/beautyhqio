import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { passwordSchema } from "./validation";
import type { AuthenticatedUser } from "./api-auth";

export const userSelect = { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatar: true, isActive: true, createdAt: true, updatedAt: true } satisfies Prisma.UserSelect;
export const userFields = z.object({
  email: z.string().trim().toLowerCase().email(),
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().max(50),
  phone: z.string().max(30).nullable().optional(),
  role: z.enum(["PLATFORM_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST", "STAFF", "CLIENT"]),
  isActive: z.boolean().optional(),
});
export const createUserSchema = userFields.extend({ role: userFields.shape.role.default("STAFF"), password: passwordSchema.max(72).optional(), businessId: z.string().min(1).optional() });
export const updateUserSchema = userFields.partial();
export function userScope(actor: AuthenticatedUser): Pick<Prisma.UserWhereInput, "businessId" | "role"> {
  return actor.isPlatformAdmin ? {} : { businessId: actor.businessId || "__none__", role: { not: "PLATFORM_ADMIN" } };
}
export function userError(error: unknown) {
  if (error instanceof z.ZodError) return NextResponse.json({ error: "INVALID_REQUEST", details: error.flatten().fieldErrors }, { status: 422 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ error: "User operation failed" }, { status: 500 });
}
