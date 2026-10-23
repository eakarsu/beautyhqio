import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { draftFillMessage, rankWaitlistForSlot } from "@/lib/waitlist-fill";

const ROLES = ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] as const;

// GET /api/waitlist/fill-suggestions?locationId=..&slotMinutes=45&slotLabel=today%20at%203pm
// Ranked, explained suggestions for filling a suddenly-open slot. Scores come
// from this business's real waitlist + visit history; the draft message is a
// template the front desk reviews before anything is sent.
export async function GET(request: NextRequest) {
  const auth = await requireRoles([...ROLES]);
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId) {
    return NextResponse.json({ error: "No business context" }, { status: 403 });
  }
  const locationId = request.nextUrl.searchParams.get("locationId");
  const slotMinutesRaw = Number(request.nextUrl.searchParams.get("slotMinutes") ?? "60");
  const slotMinutes = Number.isFinite(slotMinutesRaw) && slotMinutesRaw > 0 ? Math.min(slotMinutesRaw, 720) : 60;
  const slotLabel = request.nextUrl.searchParams.get("slotLabel") ?? "soon";
  if (!locationId) {
    return NextResponse.json({ error: "locationId is required" }, { status: 400 });
  }
  const location = await prisma.location.findFirst({
    where: { id: locationId, businessId: auth.businessId, isActive: true },
    select: { id: true, name: true, business: { select: { name: true } } },
  });
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  const entries = await prisma.waitlistEntry.findMany({
    where: { locationId: location.id, status: { in: ["WAITING", "NOTIFIED"] } },
    orderBy: { position: "asc" },
    take: 50,
    include: { client: { select: { id: true, firstName: true, lastName: true, phone: true, allowSms: true } } },
  });

  const suggestions = [];
  for (const entry of entries) {
    const client = entry.client;
    if (!client || !entry.clientId) continue;
    const history = await prisma.appointment.findMany({
      where: { clientId: entry.clientId, businessId: auth.businessId, status: { in: ["COMPLETED", "NO_SHOW"] } },
      select: { status: true },
    });
    const ranked = rankWaitlistForSlot(
      [{
        entryId: entry.id,
        clientId: entry.clientId,
        clientName: (client.firstName + " " + client.lastName).trim(),
        position: entry.position,
        estimatedDuration: entry.estimatedDuration ?? 30,
        completedVisits: history.filter((h) => h.status === "COMPLETED").length,
        noShows: history.filter((h) => h.status === "NO_SHOW").length,
        hasSmsConsent: client.allowSms,
        hasPhone: Boolean(client.phone),
      }],
      slotMinutes,
    )[0];
    suggestions.push({
      ...ranked,
      serviceNotes: entry.serviceNotes,
      draftMessage: draftFillMessage({
        clientFirstName: client.firstName,
        businessName: location.business.name,
        serviceNotes: entry.serviceNotes,
        slotLabel,
      }),
    });
  }
  suggestions.sort((a, b) => b.score - a.score || a.position - b.position);
  return NextResponse.json({ locationId: location.id, slotMinutes, suggestions });
}
