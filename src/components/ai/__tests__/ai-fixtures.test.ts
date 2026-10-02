/**
 * Enforces the contract for AI demo scenarios:
 *
 *   1. Every feature has at least TWO complete scenarios.
 *   2. Every scenario fills EVERY field (except runtime-resolved ids and
 *      user-supplied uploads), so one click populates the whole form.
 *   3. Every dropdown-backed value is one of that field's real options, so no
 *      button silently leaves a field empty.
 *   4. Scenarios are deterministic and distinct from one another.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  AI_FIXTURES,
  AI_FIXTURE_KEYS,
  RUNTIME_RESOLVED_FIELDS,
  USER_SUPPLIED_FIELDS,
  scenarioIsComplete,
  scenarioValues,
} from "@/components/ai/AIFixtures";

const ROOT = process.cwd();
const AI_DIR = join(ROOT, "src", "app", "(dashboard)", "ai");
const WELLNESS_DIR = join(ROOT, "src", "app", "(dashboard)", "dashboard", "ai-wellness");

function pageFor(key: string): string | null {
  for (const dir of [AI_DIR, WELLNESS_DIR]) {
    const file = join(dir, key, "page.tsx");
    if (existsSync(file)) return file;
  }
  return null;
}

/** Options belonging to the dropdown bound to `field` (empty when free text). */
function optionsForField(pageSrc: string, field: string): string[] {
  const idx = pageSrc.indexOf(`value={${field}}`);
  if (idx < 0) return [];
  const segment = pageSrc.slice(idx, idx + 1400);
  const options: string[] = [];
  const tokenRe = /value=\{([A-Za-z0-9_.]+)\}|<SelectItem value="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(segment)) !== null) {
    if (match[1] !== undefined) {
      if (match[1] !== field) break;
      continue;
    }
    if (match[2] !== undefined) options.push(match[2]);
  }
  return options;
}

describe("AI demo scenarios", () => {
  it("registers a fixture for every AI feature", () => {
    expect(AI_FIXTURE_KEYS.length).toBeGreaterThan(25);
  });

  it.each(AI_FIXTURE_KEYS)("%s offers at least two complete scenarios", (key) => {
    const fixture = AI_FIXTURES[key];
    expect(fixture.scenarios.length).toBeGreaterThanOrEqual(2);
  });

  it.each(AI_FIXTURE_KEYS)("%s: every scenario fills every field", (key) => {
    const fixture = AI_FIXTURES[key];
    const incomplete = fixture.scenarios
      .filter((s) => !scenarioIsComplete(fixture, s))
      .map((s) => s.label);
    expect(incomplete).toEqual([]);
  });

  it.each(AI_FIXTURE_KEYS)("%s: scenarios are distinct", (key) => {
    const fixture = AI_FIXTURES[key];
    const seen = new Set(fixture.scenarios.map((s) => JSON.stringify(scenarioValues(fixture, s))));
    expect(seen.size).toBe(fixture.scenarios.length);
  });

  it.each(AI_FIXTURE_KEYS)("%s: every scenario value is accepted by its input", (key) => {
    const fixture = AI_FIXTURES[key];
    const page = pageFor(key);
    if (!page) return;
    const pageSrc = readFileSync(page, "utf8");

    const offenders: string[] = [];
    for (const field of fixture.fields) {
      if (RUNTIME_RESOLVED_FIELDS.has(field) || USER_SUPPLIED_FIELDS.has(field)) continue;
      const options = optionsForField(pageSrc, field);
      if (options.length === 0) continue; // free text
      for (const scenario of fixture.scenarios) {
        const value = scenario.values[field];
        if (value !== undefined && value !== "" && !options.includes(value)) {
          offenders.push(`${scenario.label}.${field}: "${value}" not in [${options.join(", ")}]`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every fixture key matches its registry key", () => {
    for (const [key, fixture] of Object.entries(AI_FIXTURES)) {
      expect(fixture.key).toBe(key);
    }
  });

  it("scenarioValues falls back to a resolved id when a scenario leaves a runtime field blank", () => {
    const fixture = {
      key: "example",
      label: "Example",
      description: "Example feature",
      fields: ["clientId", "topic"],
      scenarios: [{ label: "Sample", values: { clientId: "", topic: "walk-in availability" } }],
    };
    const values = scenarioValues(fixture, fixture.scenarios[0], { clientId: "client-1" });
    expect(values.clientId).toBe("client-1");
    expect(values.topic).toBe("walk-in availability");
  });
});
