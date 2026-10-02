#!/usr/bin/env node
/**
 * Wire FillButtons into the ai-wellness pages.
 *
 * These pages hold some fields as arrays (concerns, symptoms, pain areas), so
 * the mapping declares how each fixture value reaches page state. Re-runnable.
 *
 * Usage: node scripts/wire-wellness-fill-buttons.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const project = path.resolve(__dirname, "..");
const DIR = path.join(project, "src", "app", "(dashboard)", "dashboard", "ai-wellness");

/** page -> { fixture, set: [[field, setter, kind]] }  kind: value|array|bool|number */
const PAGES = {
  "sleep-coach": {
    fixture: "sleep-coach",
    set: [
      ["bedtime", "setBedtime", "value"],
      ["wakeTime", "setWakeTime", "value"],
      ["sleepQuality", "setSleepQuality", "number"],
      ["caffeineIntake", "setCaffeineIntake", "bool"],
      ["screenTime", "setScreenTime", "number"],
      ["exercise", "setExercise", "bool"],
      ["stress", "setStress", "number"],
      ["roomTemp", "setRoomTemp", "value"],
      ["noiseLevel", "setNoiseLevel", "value"],
    ],
  },
  "symptom-checker": {
    fixture: "symptom-checker",
    set: [
      ["symptoms", "setSymptoms", "array"],
      ["duration", "setDuration", "value"],
      ["severity", "setSeverity", "value"],
      ["additionalInfo", "setAdditionalInfo", "value"],
    ],
  },
  "posture-corrector": {
    fixture: "posture-corrector",
    set: [
      ["occupation", "setOccupation", "value"],
      ["hoursSeated", "setHoursSeated", "number"],
      ["selectedPainAreas", "setSelectedPainAreas", "array"],
      ["selectedIssues", "setSelectedIssues", "array"],
      ["activityLevel", "setActivityLevel", "value"],
    ],
  },
  "skin-analyzer": {
    fixture: "skin-analyzer",
    set: [
      ["skinType", "setSkinType", "value"],
      ["concerns", "setConcerns", "array"],
      ["age", "setAge", "value"],
      ["lifestyle", "setLifestyle", "value"],
    ],
  },
  "product-recommender": {
    fixture: "product-recommender",
    set: [
      ["skinType", "setSkinType", "value"],
      ["hairType", "setHairType", "value"],
      ["selectedConcerns", "setSelectedConcerns", "array"],
      ["selectedAllergies", "setSelectedAllergies", "array"],
      ["budget", "setBudget", "value"],
    ],
  },
};

const IMPORT = [
  'import { FillButtons } from "@/components/ai/FillButtons";',
  'import { AI_FIXTURES } from "@/components/ai/AIFixtures";',
].join("\n");

function statement(field, setter, kind) {
  switch (kind) {
    case "array":
      return `                if (values.${field} !== undefined) ${setter}(String(values.${field}).split(",").map((s) => s.trim()).filter(Boolean));`;
    case "bool":
      return `                if (values.${field} !== undefined) ${setter}(values.${field} === "true");`;
    case "number":
      return `                if (values.${field} !== undefined) ${setter}(Number(values.${field}));`;
    default:
      return `                if (values.${field} !== undefined) ${setter}(values.${field});`;
  }
}

function addImports(src) {
  if (src.includes("FillButtons")) return src;
  const lines = src.split("\n");
  let last = 0;
  lines.forEach((l, i) => {
    if (l.startsWith("} from \"") || (l.startsWith("import ") && l.trimEnd().endsWith(";"))) last = i;
  });
  lines.splice(last + 1, 0, IMPORT);
  return lines.join("\n");
}

function insertButtons(src, cfg) {
  if (src.includes("<FillButtons")) return { src, inserted: true };
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes("<form") && !lines[i].includes("<CardContent")) continue;
    const window = lines.slice(i, i + 14).join("\n");
    if (/<(Input|Textarea|Select|Label|button type="button")/.test(window)) {
      const jsx = [
        "          <FillButtons",
        `            fixture={AI_FIXTURES["${cfg.fixture}"]}`,
        "            apply={(values) => {",
        ...cfg.set.map(([f, s, k]) => statement(f, s, k)),
        "            }}",
        "          />",
      ];
      lines.splice(i + 1, 0, ...jsx);
      return { src: lines.join("\n"), inserted: true };
    }
  }
  return { src, inserted: false };
}

const out = [];
for (const [page, cfg] of Object.entries(PAGES)) {
  const file = path.join(DIR, page, "page.tsx");
  if (!fs.existsSync(file)) {
    out.push(`${page}: MISSING`);
    continue;
  }
  const before = fs.readFileSync(file, "utf8");
  if (before.includes("<FillButtons")) {
    out.push(`${page}: already wired`);
    continue;
  }
  const { src, inserted } = insertButtons(addImports(before), cfg);
  fs.writeFileSync(file, src);
  out.push(`${page}: ${inserted ? "wired" : "IMPORTS ONLY (no insertion point)"}`);
}
console.log(out.join("\n"));
