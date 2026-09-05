import type { Prisma } from "@prisma/client";

// Explicit allowlist: never return password hashes or password-reset credentials.
export const publicUserSelect = {
  id: true, firstName: true, lastName: true, email: true, phone: true,
  avatar: true, role: true, isActive: true, businessId: true,
} satisfies Prisma.UserSelect;
