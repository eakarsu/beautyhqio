#!/usr/bin/env node
/**
 * Validate that every AI fixture value is usable by its page.
 *
 * A fill button is only useful if the value it writes is accepted by the field
 * it targets. Dropdowns reject unknown values silently, so a fixture like
 * tone: "warm and professional" against options like "professional" fills
 * nothing and the user sees an empty field.
 *
 * This checks each fixture example against the page's actual <SelectItem>
 * values, and flags fields whose control the fixture cannot satisfy.
 *
 * Usage: node scripts/validate-fixture-values.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const project = path.resolve(__dirname, "..");
const AI_DIR = path.join(project, "src", "app", "(dashboard)", "ai");
const FIXTURES = fs.readFileSync(path.join(project, "src", "components", "ai", "AIFixtures.ts"), "utf8");

/** Fields that are genuinely free text (no option list to satisfy). */
const FREE_TEXT = new Set([
  "topic", "text", "review", "message", "speechInput", "notes", "context", "constraints",
  "clientHistory", "details", "preferences", "goal", "service", "clientName", "segment",
  "currentService", "currentWaitlist", "averageServiceTime", "staffAvailable", "receipt",
  "headline", "description", "searchQuery", "concerns",
]);
/** Fields resolved from the database at runtime. */
const RUNTIME = new Set([
  "clientId", "staffId", "serviceId", "appointmentId", "locationId",
  "waitlistClientIds", "preferredStaff", "beforeId", "afterId",
]);
/** Fields the user must supply (uploads). */
const USER_SUPPLIED = new Set(["imageData", "beforeImage", "afterImage"]);

function overrideFields(src) {
  const out = {};
  for (const m of src.matchAll(/(\w+) = new Set\(\[([\s\S]*?)\]\)/g)) {
    out[m[1]] = new Set([...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
  }
  return out;
}

function parseFixtures(src) {
  const fixtures = {};
  const blockRe = /"([a-z0-9-]+)": \{\s*\n\s*key: "([^"]+)"[\s\S]*?fields: \[([\s\S]*?)\n    \],\n  \},/g;
  for (const m of src.matchAll(blockRe)) {
    const key = m[2];
    const fields = [];
    for (const f of m[3].matchAll(/\{ name: "([^"]+)", label: "([^"]+)", example: "([^"]*)"([^}]*)\}/g)) {
      fields.push({ name: f[1], label: f[2], example: f[3], optional: /optional: true/.test(f[4]) });
    }
    fixtures[key] = fields;
  }
  return fixtures;
}

const fixtures = parseFixtures(FIXTURES);

const problems = [];
let checked = 0;
let skippedNoPage = 0;

for (const [key, fields] of Object.entries(fixtures)) {
  const pageFile = path.join(AI_DIR, key, "page.tsx");
  if (!fs.existsSync(pageFile)) {
    skippedNoPage += 1;
    continue;
  }
  const page = fs.readFileSync(pageFile, "utf8");
  const options = new Set([...page.matchAll(/<SelectItem value="([^"]+)"/g)].map((m) => m[1]));

  for (const field of fields) {
    if (RUNTIME.has(field.name) || USER_SUPPLIED.has(field.name)) continue;
    if (FREE_TEXT.has(field.name)) continue;
    // Constrain the field when the page renders a dropdown bound to it, i.e. a
    // `value={field}` or `onValueChange={setX}` whose nearest SelectItems are
    // the ones we extracted. Pages with any dropdown at all are candidates.
    const boundToField = new RegExp(`value=\\{${field.name}\\}`).test(page);
    if (!boundToField && options.size === 0) continue;
    checked += 1;
    // A value is acceptable if it is one of the options, or if no option list
    // applies to this specific field (option set spans several fields).
    if (!options.has(field.example)) {
      problems.push({ key, field: field.name, example: field.example, options: [...options].sort() });
    }
  }
}

console.log(`fixtures: ${Object.keys(fixtures).length}`);
console.log(`select-backed fields checked: ${checked}`);
console.log(`fixtures without a page yet: ${skippedNoPage}`);
console.log("");
if (problems.length === 0) {
  console.log("✓ every select-backed fixture value matches an available option");
  process.exit(0);
}
console.log("✗ values that would silently fill nothing:");
for (const p of problems) {
  console.log(`  ${p.key}.${p.field}: example="${p.example}"`);
  console.log(`      options: ${p.options.join(", ")}`);
}
process.exit(1);
