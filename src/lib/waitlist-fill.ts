export interface FillCandidate {
  entryId: string;
  clientId: string;
  clientName: string;
  position: number;
  estimatedDuration: number;
  /** Past completed visits for this client at the business. */
  completedVisits: number;
  /** Past no-shows; higher means less reliable for a last-minute fill. */
  noShows: number;
  hasSmsConsent: boolean;
  hasPhone: boolean;
}

export interface FillSuggestion extends FillCandidate {
  score: number;
  reasons: string[];
}

/**
 * Rank waitlist entries for a suddenly-open slot. Deterministic and fully
 * explained: queue order dominates, then duration fit, reliability, and
 * whether we can actually reach the client. No provider call is needed, so
 * this works with or without an AI key configured.
 */
export function rankWaitlistForSlot(
  candidates: FillCandidate[],
  slotMinutes: number,
): FillSuggestion[] {
  return candidates
    .map((c) => {
      let score = 100 - c.position * 5;
      const reasons: string[] = ["Queue position " + c.position];
      if (c.estimatedDuration <= slotMinutes) {
        score += 20;
        reasons.push("Fits the open slot (" + c.estimatedDuration + "m <= " + slotMinutes + "m)");
      } else {
        score -= 25;
        reasons.push("Needs " + c.estimatedDuration + "m, longer than the " + slotMinutes + "m slot");
      }
      if (c.noShows > 0) {
        score -= c.noShows * 15;
        reasons.push(c.noShows + " past no-show(s)");
      }
      if (c.completedVisits > 0) {
        score += Math.min(c.completedVisits * 2, 10);
        reasons.push(c.completedVisits + " completed visit(s)");
      }
      if (c.hasSmsConsent && c.hasPhone) {
        score += 10;
        reasons.push("Reachable by SMS");
      } else {
        score -= 10;
        reasons.push("No SMS consent or phone on file");
      }
      return { ...c, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.position - b.position);
}

export function draftFillMessage(input: {
  clientFirstName: string;
  businessName: string;
  serviceNotes?: string | null;
  slotLabel: string;
}): string {
  const service = input.serviceNotes ? " for " + input.serviceNotes : "";
  return (
    "Hi " + input.clientFirstName + ", this is " + input.businessName +
    ". A slot just opened " + input.slotLabel + service +
    ". Reply YES in the next 15 minutes and we will hold it for you."
  );
}
