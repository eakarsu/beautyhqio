#!/usr/bin/env node
/**
 * Verify that each page's FillButtons handler actually applies EVERY field its
 * fixture defines.
 *
 * A scenario fills all fields, but the page must copy all of them into state.
 * If the handler omits a field, that input silently stays empty — the exact bug
 * this checks for.
 *
 * Usage: node scripts/verify-fill-handlers.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const project = path.resolve(__dirname, "..");
const DIRS = [
  path.join(project, "src", "app", "(dashboard)", "ai"),
  path.join(project, "src", "app", "(dashboard)", "dashboard", "ai-wellness"),
];

const data = JSON.parse(
  fs
    .readFileSync(path.join(project, "src", "components", "ai", "ai-fixture-data.ts"), "utf8")
    .replace(/^[\s\S]*?=\s*/, "")
    .replace(/;\s*$/, ""),
);

let problems = 0;
let checked = 0;

for (const dir of DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir)) {
    const file = path.join(dir, entry, "page.tsx");
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, "utf8");
    if (!src.includes("<FillButtons")) continue;

    const fixtureKey = (src.match(/AI_FIXTURES\["([^"]+)"\]/) || [])[1];
    if (!fixtureKey || !data[fixtureKey]) continue;
    const fields = data[fixtureKey].fields;

    // Collect every field name the handler references.
    const handler = src.slice(src.indexOf("<FillButtons"), src.indexOf("<FillButtons") + 1600);
    const referenced = new Set([...handler.matchAll(/values\.(\w+)/g)].map((m) => m[1]));

    const missing = fields.filter((f) => !referenced.has(f));
    checked += 1;
    if (missing.length) {
      problems += 1;
      console.log(`  ${entry}: handler misses [${missing.join(", ")}]`);
    } else {
      console.log(`  ok  ${entry} (${fields.length} fields)`);
    }
  }
}

console.log(`\npages checked: ${checked}, with missing fields: ${problems}`);
process.exit(problems ? 1 : 0);
