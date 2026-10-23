import { parseDueAt, parseTaskPriority, pickClientAutomationUpdate } from "@/lib/tasks";
import { draftFillMessage, rankWaitlistForSlot } from "@/lib/waitlist-fill";

describe("automation task helpers", () => {
  test("priority falls back to NORMAL for unknown values", () => {
    expect(parseTaskPriority("HIGH")).toBe("HIGH");
    expect(parseTaskPriority("LOW")).toBe("LOW");
    expect(parseTaskPriority("urgent")).toBe("NORMAL");
    expect(parseTaskPriority(undefined)).toBe("NORMAL");
  });

  test("due date parses ISO and rejects garbage", () => {
    expect(parseDueAt("2026-10-20T09:00:00.000Z")?.toISOString()).toBe("2026-10-20T09:00:00.000Z");
    expect(parseDueAt("not-a-date")).toBeNull();
    expect(parseDueAt("")).toBeNull();
    expect(parseDueAt(42)).toBeNull();
  });

  test("update_record only allows safe client fields", () => {
    const ok = pickClientAutomationUpdate({ internalNotes: "Called twice", status: "VIP" });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(Object.keys(ok.data).sort()).toEqual(["internalNotes", "status"]);

    const bad = pickClientAutomationUpdate({ businessId: "other-tenant" });
    expect(bad.ok).toBe(false);

    const badStatus = pickClientAutomationUpdate({ status: "DELETED" });
    expect(badStatus.ok).toBe(false);

    expect(pickClientAutomationUpdate({}).ok).toBe(false);
  });
});

describe("waitlist fill ranking", () => {
  const base = { completedVisits: 0, noShows: 0, hasSmsConsent: true, hasPhone: true };

  test("reachable, fitting, reliable client outranks earlier unreachable one", () => {
    const ranked = rankWaitlistForSlot(
      [
        { ...base, entryId: "a", clientId: "ca", clientName: "A", position: 1, estimatedDuration: 90, hasSmsConsent: false, hasPhone: false },
        { ...base, entryId: "b", clientId: "cb", clientName: "B", position: 2, estimatedDuration: 30, completedVisits: 4 },
      ],
      45,
    );
    expect(ranked[0].entryId).toBe("b");
    expect(ranked[0].reasons.join(" ")).toMatch(/Fits the open slot/);
    expect(ranked[1].reasons.join(" ")).toMatch(/longer than/);
  });

  test("no-shows are penalised and every score is explained", () => {
    const ranked = rankWaitlistForSlot(
      [{ ...base, entryId: "x", clientId: "cx", clientName: "X", position: 1, estimatedDuration: 30, noShows: 2 }],
      60,
    );
    expect(ranked[0].score).toBeLessThan(100);
    expect(ranked[0].reasons.length).toBeGreaterThan(1);
  });

  test("draft message names client, business, and slot without inventing facts", () => {
    const msg = draftFillMessage({
      clientFirstName: "Ada",
      businessName: "Luxe Beauty Studio",
      serviceNotes: "haircut",
      slotLabel: "today at 3:30 PM",
    });
    expect(msg).toContain("Ada");
    expect(msg).toContain("Luxe Beauty Studio");
    expect(msg).toContain("3:30 PM");
  });
});
