#!/usr/bin/env node
/**
 * Generate the AI feature pages that exist as API routes but had no UI.
 *
 * Each page is a thin declaration over the shared AIToolPage shell, so every
 * tool gets consistent layout, per-field fill buttons and error handling.
 *
 * Re-runnable: existing pages are skipped unless --force is passed.
 * Usage: node scripts/generate-ai-pages.cjs [--force]
 */
const fs = require("node:fs");
const path = require("node:path");

const project = path.resolve(__dirname, "..");
const AI_DIR = path.join(project, "src", "app", "(dashboard)", "ai");
const force = process.argv.includes("--force");

/** directory -> { fixtureKey, title, description, endpoint, method } */
const PAGES = [
  { dir: "translate", fixtureKey: "translate", title: "Translate", endpoint: "/api/ai/translate",
    description: "Translate a client-facing message into another language." },
  { dir: "message-generator", fixtureKey: "message-generator", title: "Message Generator", endpoint: "/api/ai/message-generator",
    description: "Draft a client message for a chosen purpose and tone." },
  { dir: "review-response", fixtureKey: "review-response", title: "Review Response", endpoint: "/api/ai/review-response",
    description: "Draft a reply to a customer review." },
  { dir: "business-insights", fixtureKey: "business-insights", title: "Business Insights", endpoint: "/api/ai/business-insights",
    description: "Summarise operating performance over a period." },
  { dir: "appointment-optimizer", fixtureKey: "appointment-optimizer", title: "Appointment Optimizer", endpoint: "/api/ai/appointment-optimizer",
    description: "Find schedule gaps and suggest improvements for a day." },
  { dir: "staff-matcher", fixtureKey: "staff-matcher", title: "Staff Matcher", endpoint: "/api/ai/staff-matcher",
    description: "Match a client and service to the best-suited staff member." },
  { dir: "therapist-match", fixtureKey: "therapist-match", title: "Therapist Match", endpoint: "/api/ai/therapist-match",
    description: "Match a client to a suitable therapist for a service." },
  { dir: "booking-assistant", fixtureKey: "booking-assistant", title: "Booking Assistant", endpoint: "/api/ai/booking-assistant",
    description: "Turn a natural-language request into a booking suggestion." },
  { dir: "checkin-recommend", fixtureKey: "checkin-recommend", title: "Check-in Recommendations", endpoint: "/api/ai/checkin-recommend",
    description: "Suggest add-ons and next steps when a client checks in." },
  { dir: "waitlist-intelligence", fixtureKey: "waitlist-intelligence", title: "Waitlist Intelligence", endpoint: "/api/ai/waitlist-intelligence",
    description: "Rank waitlisted clients for a given opening." },
  { dir: "inventory-autopilot", fixtureKey: "inventory-autopilot", title: "Inventory Autopilot", endpoint: "/api/ai/inventory-autopilot",
    description: "Review stock and suggest reorders." },
  { dir: "before-after", fixtureKey: "before-after", title: "Before & After", endpoint: "/api/ai/before-after",
    description: "Compare two service photographs." },
  { dir: "staff-shift-preferences", fixtureKey: "staff-shift-preferences", title: "Shift Preferences", endpoint: "/api/ai/staff-shift-preferences",
    description: "Infer preferred shifts from a staff member's history." },
  { dir: "voice-receptionist", fixtureKey: "voice-receptionist", title: "Voice Receptionist", endpoint: "/api/ai/voice-receptionist",
    description: "Handle an incoming caller and draft the receptionist reply." },
  { dir: "skin-kiosk", fixtureKey: "skin-kiosk", title: "Skin Kiosk", endpoint: "/api/ai/skin-kiosk",
    description: "Cosmetic observations from a photo, within consent limits." },
];

const template = ({ fixtureKey, title, description, endpoint, method }) => `"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function ${pascal(title)}Page() {
  return (
    <AIToolPage
      fixtureKey="${fixtureKey}"
      title="${title.replace(/"/g, '\\"')}"
      description="${description.replace(/"/g, '\\"')}"
      endpoint="${endpoint}"${method ? `\n      method="${method}"` : ""}
    />
  );
}
`;

function pascal(s) {
  return s
    .replace(/&/g, "And")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

const results = [];
for (const page of PAGES) {
  const dir = path.join(AI_DIR, page.dir);
  const file = path.join(dir, "page.tsx");
  if (fs.existsSync(file) && !force) {
    results.push(`${page.dir}: exists, skipped`);
    continue;
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, template(page));
  results.push(`${page.dir}: created`);
}

console.log(results.join("\n"));
