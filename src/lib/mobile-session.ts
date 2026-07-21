import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import type { Prisma, PrismaClient, User } from "@prisma/client";
import { authSecret } from "./runtime-env";

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
type Database = PrismaClient | Prisma.TransactionClient;

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(user: Pick<User, "id" | "email" | "businessId" | "role">) {
  return jwt.sign(
    { userId: user.id, email: user.email, businessId: user.businessId, role: user.role, type: "access" },
    authSecret(),
    { algorithm: "HS256", expiresIn: ACCESS_TTL_SECONDS, issuer: "beautyhq", audience: "beautyhq-mobile" },
  );
}

export async function issueMobileSession(db: Database, user: Pick<User, "id" | "email" | "businessId" | "role">) {
  const refreshToken = randomBytes(48).toString("base64url");
  await db.mobileSession.create({
    data: { userId: user.id, tokenHash: digest(refreshToken), expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });
  return { token: signAccessToken(user), refreshToken, expiresIn: ACCESS_TTL_SECONDS };
}

export async function rotateMobileSession(db: PrismaClient, refreshToken: string) {
  if (!/^[A-Za-z0-9_-]{50,100}$/.test(refreshToken)) return null;
  return db.$transaction(async (tx) => {
    const session = await tx.mobileSession.findUnique({ where: { tokenHash: digest(refreshToken) }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) return null;
    const revoked = await tx.mobileSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: new Date(), lastUsedAt: new Date() } });
    if (revoked.count !== 1) return null;
    return issueMobileSession(tx, session.user);
  });
}

export async function revokeMobileSession(db: PrismaClient, refreshToken: string) {
  if (!/^[A-Za-z0-9_-]{50,100}$/.test(refreshToken)) return;
  await db.mobileSession.updateMany({ where: { tokenHash: digest(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function enforceLoginRateLimit(db: PrismaClient, identity: string) {
  const identityHash = digest(identity.toLowerCase());
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const failures = await db.loginAttempt.count({ where: { identityHash, succeeded: false, createdAt: { gte: since } } });
  if (failures >= 10) throw new Error("RATE_LIMITED");
  return identityHash;
}
