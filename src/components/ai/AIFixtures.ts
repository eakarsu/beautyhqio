/**
 * Demo scenarios for AI feature pages.
 *
 * Each feature declares SEVERAL complete scenarios. Every scenario fills ALL of
 * the feature's fields, so one click populates the whole form — there are no
 * single-field buttons.
 *
 *   trigger: "New colour client"   -> every field, all at once
 *   trigger: "Maintenance visit"   -> every field, a different complete case
 *
 * Scenarios are deterministic and clearly fictional.
 */

export interface AIScenario {
  /** Button label, e.g. "New colour client". */
  label: string;
  /** Short note shown as the button tooltip. */
  hint?: string;
  /** A complete set of values: every field the feature uses. */
  values: Record<string, string>;
}

export interface AIFixture {
  /** Stable id, e.g. "sentiment". */
  key: string;
  /** Feature title. */
  label: string;
  /** One-line description. */
  description: string;
  /** The fields this feature uses, in display order. */
  fields: string[];
  /** Two or more complete scenarios. Each fills every field. */
  scenarios: AIScenario[];
}

/**
 * Fields resolved from the database at runtime (ids the page already loaded).
 * A scenario may omit these; the page splices in real ids so the request is
 * valid rather than inventing a fake one.
 */
export const RUNTIME_RESOLVED_FIELDS = new Set([
  "clientId",
  "staffId",
  "serviceId",
  "appointmentId",
  "locationId",
  "waitlistClientIds",
  "preferredStaff",
  "beforeId",
  "afterId",
]);

/** Fields only the user can supply (uploads). Scenarios leave these untouched. */
export const USER_SUPPLIED_FIELDS = new Set([
  "imageData",
  "beforeImage",
  "afterImage",
]);

/** Human labels for fields, so buttons and forms can show meaningful names. */
export const FIELD_LABELS: Record<string, string> = {
  text: "Text",
  targetLanguage: "Target language",
  context: "Context",
  recipientName: "Recipient",
  purpose: "Purpose",
  tone: "Tone",
  details: "Details",
  review: "Review text",
  rating: "Rating",
  customerName: "Customer",
  period: "Period",
  timeframe: "Timeframe",
  locationId: "Location",
  date: "Date",
  staffId: "Staff member",
  optimize: "Optimise for",
  clientId: "Client",
  serviceId: "Service",
  preferences: "Preferences",
  lookbackDays: "Look back (days)",
  appointmentId: "Appointment",
  waitlistClientIds: "Waitlisted clients",
  message: "Message",
  speechInput: "Caller speech",
  from: "Caller number",
  language: "Language",
  beforeId: "Before photo",
  afterId: "After photo",
  serviceName: "Service",
  concerns: "Concerns",
  imageData: "Image",
  kioskId: "Kiosk",
  skinType: "Skin type",
  hairType: "Hair type",
  age: "Age",
  lifestyle: "Lifestyle",
  currentServices: "Current services",
  platform: "Platform",
  postType: "Post type",
  topic: "Topic",
  currentWaitlist: "Current waitlist",
  averageServiceTime: "Average service time",
  staffAvailable: "Staff available",
  dayType: "Day type",
  bedtime: "Bedtime",
  wakeTime: "Wake time",
  sleepQuality: "Sleep quality",
  caffeineIntake: "Caffeine",
  screenTime: "Screen time",
  exercise: "Exercise",
  stress: "Stress",
  roomTemp: "Room temperature",
  noiseLevel: "Noise",
  symptoms: "Symptoms",
  duration: "Duration",
  severity: "Severity",
  additionalInfo: "Additional information",
  occupation: "Occupation",
  hoursSeated: "Hours seated",
  selectedPainAreas: "Pain areas",
  selectedIssues: "Issues",
  activityLevel: "Activity level",
  selectedConcerns: "Concerns",
  selectedAllergies: "Allergies",
  budget: "Budget",
  currentService: "Current service",
  clientHistory: "Client history",
  currentPrice: "Current price",
  marketPosition: "Market position",
  goal: "Goal",
  service: "Service",
  inactiveDays: "Inactive days",
  segment: "Segment",
  campaignType: "Campaign type",
  category: "Category",
  seasonalFactor: "Seasonal factor",
  currentWaitlistCount: "Waitlist count",
  moodScore: "Mood",
  stressLevel: "Stress level",
  preferredTime: "Preferred time",
  constraints: "Constraints",
};

export function fieldLabel(name: string): string {
  return FIELD_LABELS[name] ?? name.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

/** Values for one scenario, with runtime ids spliced in where available. */
export function scenarioValues(
  fixture: AIFixture,
  scenario: AIScenario,
  resolvers: Record<string, string> = {},
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of fixture.fields) {
    const supplied = scenario.values[field];
    // Scenarios carry runtime ids as "" placeholders; prefer a real resolved id.
    if (supplied !== undefined && supplied !== "") out[field] = supplied;
    else if (resolvers[field] !== undefined && resolvers[field] !== "") {
      out[field] = resolvers[field];
    }
  }
  return out;
}

/**
 * A scenario is complete when it defines every field except runtime-resolved
 * ids and user-supplied uploads.
 */
export function scenarioIsComplete(fixture: AIFixture, scenario: AIScenario): boolean {
  return fixture.fields.every(
    (field) =>
      RUNTIME_RESOLVED_FIELDS.has(field) ||
      USER_SUPPLIED_FIELDS.has(field) ||
      String(scenario.values[field] ?? "").trim() !== "",
  );
}

import { AI_FIXTURES } from "./ai-fixture-data";

export { AI_FIXTURES };
export const AI_FIXTURE_KEYS = Object.keys(AI_FIXTURES);
