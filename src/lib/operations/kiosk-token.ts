/**
 * Kiosk device tokens.
 *
 * Kiosk screens are public browser pages with no signed-in user, but they must
 * not expose other tenants' data. Each kiosk device is issued a token bound to
 * one location (and therefore one business). The token is an HMAC over the
 * location id, so no storage is required and it can be rotated by changing the
 * secret.
 *
 * Configure with KIOSK_TOKEN_SECRET (falls back to NEXTAUTH_SECRET). Issue a
 * token for a location with `kioskTokenFor(locationId)` and install it on the
 * device; requests send it as `x-kiosk-token`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { fail } from "./core";

function secret(): string {
  const value = process.env.KIOSK_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value || value.length < 16) {
    // Fail closed: without a sufficiently strong secret we cannot verify kiosks.
    fail(503, "Kiosk tokens are not configured on this deployment");
  }
  return value;
}

export function kioskTokenFor(locationId: string): string {
  return createHmac("sha256", secret()).update(`kiosk:${locationId}`).digest("hex");
}

/**
 * Verify an `x-kiosk-token` header against a claimed locationId.
 * Returns the locationId when valid, otherwise fails the request.
 */
export function requireKioskToken(header: string | null, locationId: string | null): string {
  if (!locationId) fail(400, "locationId is required");
  if (!header) fail(401, "A kiosk token is required");

  const expected = kioskTokenFor(locationId);
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    fail(403, "Invalid kiosk token for this location");
  }
  return locationId;
}

/** Resolve a kiosk token to its location and business when the location is omitted. */
export async function resolveKioskLocation(
  prismaClient: PrismaClient,
  header: string | null,
): Promise<{ id: string; businessId: string }> {
  if (!header) fail(401, "A kiosk token is required");
  // Linear scan is acceptable: the number of active kiosk locations is small,
  // and this avoids storing tokens. Comparisons are constant-time.
  const locations = await prismaClient.location.findMany({
    where: { isActive: true },
    select: { id: true, businessId: true },
  });
  for (const loc of locations) {
    const expected = kioskTokenFor(loc.id);
    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return loc;
  }
  return fail(403, "Unrecognised kiosk token");
}
