#!/usr/bin/env node
/**
 * Wire the shared FillButtons into AI feature pages.
 *
 * Each page keeps its own state shape, so this maps fixture field names to the
 * page's setters explicitly rather than patching state generically. Re-runnable:
 * pages that already import FillButtons are left alone.
 *
 * Usage: node scripts/wire-ai-fill-buttons.cjs [--check]
 */
const fs = require("node:fs");
const path = require("node:path");

const project = path.resolve(__dirname, "..");
const AI_DIR = path.join(project, "src", "app", "(dashboard)", "ai");

/** page -> { fixtureKey, apply: [[fieldName, setter], ...], clear: [[setter, initial], ...] } */
const PAGES = {
  inventory: {
    fixtureKey: "inventory",
    apply: [
      ["category", "setCategory"],
      ["timeframe", "setTimeframe"],
      ["seasonalFactor", "setSeasonalFactor"],
    ],
    clear: [
      ["setCategory", '""'],
      ["setTimeframe", '""'],
      ["setSeasonalFactor", '""'],
    ],
  },
  pricing: {
    fixtureKey: "pricing",
    apply: [
      ["service", "setService"],
      ["currentPrice", "setCurrentPrice"],
      ["marketPosition", "setMarketPosition"],
      ["goal", "setGoal"],
    ],
    clear: [
      ["setService", '""'],
      ["setCurrentPrice", '""'],
      ["setMarketPosition", '""'],
      ["setGoal", '""'],
    ],
  },
  reactivation: {
    fixtureKey: "reactivation",
    apply: [
      ["inactiveDays", "setInactiveDays"],
      ["segment", "setSegment"],
      ["campaignType", "setCampaignType"],
    ],
    clear: [
      ["setInactiveDays", '""'],
      ["setSegment", '""'],
      ["setCampaignType", '""'],
    ],
  },
  "social-media": {
    fixtureKey: "social-media",
    apply: [
      ["platform", "setPlatform"],
      ["postType", "setPostType"],
      ["topic", "setTopic"],
      ["tone", "setTone"],
    ],
    clear: [
      ["setPlatform", '""'],
      ["setPostType", '""'],
      ["setTopic", '""'],
      ["setTone", '""'],
    ],
  },
  upsell: {
    fixtureKey: "upsell",
    apply: [
      ["clientName", "setClientName"],
      ["currentService", "setCurrentService"],
      ["clientHistory", "setClientHistory"],
    ],
    clear: [
      ["setClientName", '""'],
      ["setCurrentService", '""'],
      ["setClientHistory", '""'],
    ],
  },
  waitlist: {
    fixtureKey: "waitlist",
    apply: [
      ["currentWaitlist", "setCurrentWaitlist"],
      ["averageServiceTime", "setAverageServiceTime"],
      ["staffAvailable", "setStaffAvailable"],
      ["dayType", "setDayType"],
    ],
    clear: [
      ["setCurrentWaitlist", '""'],
      ["setAverageServiceTime", '""'],
      ["setStaffAvailable", '""'],
      ["setDayType", '""'],
    ],
  },
  sentiment: {
    fixtureKey: "sentiment",
    apply: [["review", "setReview"]],
    clear: [["setReview", '""']],
  },
};

/** Fixtures that do not exist yet in AIFixtures.ts get added by the caller. */
const checkOnly = process.argv.includes("--check");

function importBlock() {
  return [
    'import { FillButtons } from "@/components/ai/FillButtons";',
    'import { AI_FIXTURES } from "@/components/ai/AIFixtures";',
  ].join("\n");
}

function addImports(src) {
  if (src.includes("FillButtons")) return src;
  const lines = src.split("\n");
  const lastImport = lines.reduce((acc, l, i) => (l.startsWith("import ") ? i : acc), 0);
  lines.splice(lastImport + 1, 0, importBlock());
  return lines.join("\n");
}

function buttonsJsx(cfg) {
  const apply = cfg.apply.map(([field, setter]) => `                if (values.${field} !== undefined) ${setter}(values.${field});`).join("\n");
  const clear = cfg.clear.map(([setter, val]) => `${setter}(${val})`).join("; ");
  return `            <FillButtons
              fixture={AI_FIXTURES["${cfg.fixtureKey}"]}
              apply={(values) => {
${apply}
              }}
              onClear={() => { ${clear}; }}
            />`;
}

/** Insert the buttons immediately after the form card's opening CardContent. */
function insertButtons(src, cfg) {
  if (src.includes("<FillButtons")) return { src, inserted: false };
  const lines = src.split("\n");
  // Find the first CardContent that is followed (within a few lines) by a form control.
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes("<CardContent")) continue;
    const window = lines.slice(i, i + 12).join("\n");
    if (/<(Input|Textarea|Select|Label)/.test(window)) {
      lines.splice(i + 1, 0, buttonsJsx(cfg));
      return { src: lines.join("\n"), inserted: true };
    }
  }
  return { src, inserted: false };
}

const results = [];
for (const [page, cfg] of Object.entries(PAGES)) {
  const file = path.join(AI_DIR, page, "page.tsx");
  if (!fs.existsSync(file)) {
    results.push(`${page}: MISSING FILE`);
    continue;
  }
  const before = fs.readFileSync(file, "utf8");
  if (before.includes("<FillButtons")) {
    results.push(`${page}: already wired`);
    continue;
  }
  let next = addImports(before);
  const { src, inserted } = insertButtons(next, cfg);
  next = src;
  if (!inserted) {
    results.push(`${page}: COULD NOT FIND INSERTION POINT (imports added only)`);
  } else {
    results.push(`${page}: wired`);
  }
  if (!checkOnly) fs.writeFileSync(file, next);
}

console.log(results.join("\n"));
