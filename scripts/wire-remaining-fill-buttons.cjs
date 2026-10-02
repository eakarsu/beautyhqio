#!/usr/bin/env node
/**
 * Wire scenario buttons into the remaining AI pages that have inputs but no
 * fill buttons: voice settings, voice, no-show, chat and sms-chat.
 *
 * These pages differ in shape (a nested settings object, a live-call screen, a
 * chat input, a client selector), so each mapping is explicit. Re-runnable.
 */
const fs = require("node:fs");
const path = require("node:path");

const project = path.resolve(__dirname, "..");
const AI_DIR = path.join(project, "src", "app", "(dashboard)", "ai");

const IMPORT = [
  'import { FillButtons } from "@/components/ai/FillButtons";',
  'import { AI_FIXTURES } from "@/components/ai/AIFixtures";',
].join("\n");

/** page -> { fixture, applyBody, clearBody, anchor } */
const PAGES = {
  "voice/settings": {
    fixture: "voice-settings",
    applyBody: `              setSettings((prev) => ({ ...prev, ...values }));`,
    clearBody: `              setSettings((prev) => ({ ...prev, customGreeting: "", transferNumber: "" }));`,
  },
  voice: {
    fixture: "voice",
    applyBody: `              if (values.twilioPhoneNumber !== undefined) setTwilioPhoneNumber(values.twilioPhoneNumber);`,
    clearBody: `              setTwilioPhoneNumber("");`,
  },
  chat: {
    fixture: "chat",
    applyBody: `              if (values.input !== undefined) setInput(values.input);`,
    clearBody: `              setInput("");`,
  },
  "sms-chat": {
    fixture: "sms-chat",
    applyBody: `              if (values.input !== undefined) setInput(values.input);`,
    clearBody: `              setInput("");`,
  },
};

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

function block(cfg, indent) {
  return [
    `${indent}<FillButtons`,
    `${indent}  fixture={AI_FIXTURES["${cfg.fixture}"]}`,
    `${indent}  apply={(values) => {`,
    cfg.applyBody,
    `${indent}  }}`,
    `${indent}  onClear={() => {`,
    cfg.clearBody,
    `${indent}  }}`,
    `${indent}/>`,
  ].join("\n");
}

function insert(src, cfg) {
  if (src.includes("<FillButtons")) return { src, inserted: true };
  const lines = src.split("\n");
  // Prefer an input/textarea/form; fall back to the first CardContent.
  const patterns = [/<(Input|Textarea)\b/, /<form\b/, /<CardContent\b/];
  for (const re of patterns) {
    for (let i = 0; i < lines.length; i += 1) {
      if (!re.test(lines[i])) continue;
      // Insert just after the enclosing opening tag line.
      lines.splice(i, 0, block(cfg, "      "));
      return { src: lines.join("\n"), inserted: true };
    }
  }
  return { src, inserted: false };
}

const out = [];
for (const [page, cfg] of Object.entries(PAGES)) {
  const file = path.join(AI_DIR, page, "page.tsx");
  if (!fs.existsSync(file)) {
    out.push(`${page}: MISSING`);
    continue;
  }
  const before = fs.readFileSync(file, "utf8");
  if (before.includes("<FillButtons")) {
    out.push(`${page}: already wired`);
    continue;
  }
  const { src, inserted } = insert(addImports(before), cfg);
  fs.writeFileSync(file, src);
  out.push(`${page}: ${inserted ? "wired" : "IMPORTS ONLY"}`);
}
console.log(out.join("\n"));
