#!/usr/bin/env node
/**
 * Exercise EVERY AI feature route and report real outcomes.
 *
 * Wider than smoke-ai-routes.cjs: covers all 39 routes under /api/ai, including
 * the ones that predate the fixture work. Bodies use the field names the routes
 * actually require, so a failure here means the feature is broken, not the test.
 *
 * Usage: node scripts/verify-all-ai.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");

const project = path.resolve(__dirname, "..");
const env = parseEnv(fs.readFileSync(path.join(project, ".env"), "utf8"));
const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:30802";

/** route -> { method, body }  (null body = GET) */
const CASES = {
  "appointment-optimizer": { body: { date: "2026-10-06", optimize: "gaps" } },
  "before-after": { body: { clientId: "__client__", beforeId: "__photo__", afterId: "__photo__", serviceName: "Demo colour" } },
  "booking-assistant": { body: { message: "I would like a colour appointment next Tuesday afternoon.", conversationHistory: [] } },
  "business-insights": { method: "GET" },
  chat: { body: { messages: [{ role: "user", content: "Summarise my day in one sentence." }] } },
  "checkin-recommend": { body: { clientId: "__client__" } },
  "client-insights": { body: { clientId: "__client__" } },
  "front-desk-copilot": { method: "GET" },
  "inventory-autopilot": { body: {} },
  "inventory-forecast": { body: { category: "Hair Care", timeframe: "30", seasonalFactor: "normal" } },
  "loyalty-optimizer": { body: {} },
  "mental-health": { body: { message: "I feel overwhelmed this week and am not sleeping well." } },
  "message-generator": { body: { type: "appointment_reminder", clientName: "Avery", businessName: "Luxe Beauty Studio", details: "Tuesday 10:00." } },
  "no-show-prediction": { body: { clientId: "__client__", appointmentId: "__appointment__" } },
  "posture-corrector": { body: { occupation: "office", hoursSeated: 6, painAreas: ["neck"], activityLevel: "moderate" } },
  "price-optimizer": { body: { service: "Balayage", currentPrice: 180, marketPosition: "mid", goal: "increase_revenue" } },
  "product-recommender": { body: { concerns: ["dryness"], budget: "mid-range" } },
  "reactivation-campaigns": { body: { inactiveDays: 90, segment: "lapsed", campaignType: "we_miss_you" } },
  "revenue-predictor": { body: { timeframe: "next_month", includeSeasonality: true } },
  "review-response": { body: { rating: 3, reviewText: "Lovely stylist, but I waited twenty minutes." } },
  sentiment: { body: { reviewText: "Lovely stylist, but I waited twenty minutes.", source: "Google" } },
  "skin-analyzer": { body: { skinType: "combination", concerns: ["dryness", "dullness"], age: 35, lifestyle: "office work" } },
  "skin-kiosk": { body: { clientId: "__client__", concerns: "General cosmetic skincare.", imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" } },
  "sleep-coach": { body: { bedtime: "23:30", wakeTime: "06:30", sleepQuality: 5, stress: 6 } },
  "smart-scheduling": { body: { preferredTime: "afternoon", serviceIds: ["__service__"], constraints: "Avoid mornings." } },
  "sms-chat": { body: { message: "Do you have anything Saturday?", from: "+18045550100" } },
  "social-media": { body: { platform: "instagram", postType: "transformation", topic: "colour transformation", tone: "professional" } },
  "staff-matcher": { body: { clientId: "__client__", serviceId: "__service__" } },
  "staff-shift-preferences": { body: { staffId: "__staff__", lookbackDays: 60 } },
  "style-recommendation": { body: { clientId: "__client__", preferences: { hairLength: "medium", hairType: "wavy", lifestyle: "office", maintenance: "moderate" } } },
  "symptom-checker": { body: { symptoms: ["headache"], duration: "1 day", severity: "mild" } },
  "therapist-match": { body: { clientId: "__client__" } },
  translate: { body: { text: "Your appointment is confirmed for Tuesday at 10:00.", targetLanguage: "Spanish" } },
  "upsell-suggestions": { body: { clientId: "__client__", currentServices: [{ name: "Haircut", price: 0 }] } },
  "voice-receptionist": { body: { speechInput: "I would like to book a haircut Saturday morning.", language: "en" } },
  "waitlist": { body: { currentWaitlist: "6 clients", averageServiceTime: "45", staffAvailable: "3", dayType: "saturday" } },
  "waitlist-intelligence": { body: { appointmentId: "__appointment__" } },
};

(async () => {
  const jar = [];
  const cookieHeader = () => jar.map((c) => `${c.name}=${c.value}`).join("; ");
  const remember = (res) => {
    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(";");
      const i = pair.indexOf("=");
      jar.push({ name: pair.slice(0, i), value: pair.slice(i + 1) });
    }
  };

  let res = await fetch(`${BASE}/api/auth/csrf`);
  remember(res);
  const { csrfToken } = await res.json();
  res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieHeader() },
    body: new URLSearchParams({ csrfToken, email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, json: "true" }),
    redirect: "manual",
  });
  remember(res);
  const session = await (await fetch(`${BASE}/api/auth/session`, { headers: { cookie: cookieHeader() } })).json();
  if (!session?.user) {
    console.error("auth failed");
    process.exit(1);
  }

  const unwrap = (v) => (Array.isArray(v) ? v : (Array.isArray(v?.data) ? v.data : v?.clients ?? v?.services ?? v?.staff ?? v?.appointments ?? []));
  const api = async (p) => {
    const r = await fetch(`${BASE}${p}`, { headers: { cookie: cookieHeader() } });
    return r.ok ? r.json() : [];
  };
  const clients = unwrap(await api("/api/clients"));
  const services = unwrap(await api("/api/services"));
  const staff = unwrap(await api("/api/staff"));
  const appointments = unwrap(await api("/api/appointments"));
  const photos = clients[0] ? unwrap(await api(`/api/clients/${clients[0].id}/photos`)) : [];
  const ids = {
    __client__: clients[0]?.id ?? null,
    __service__: services[0]?.id ?? null,
    __staff__: staff[0]?.id ?? null,
    __appointment__: appointments[0]?.id ?? null,
    __photo__: photos[0]?.id ?? null,
  };

  const rows = [];
  for (const [name, cfg] of Object.entries(CASES)) {
    const method = cfg.method || "POST";
    let body = cfg.body;
    if (body) {
      const raw = JSON.stringify(body).replace(/"__(\w+)__"/g, (m, k) => JSON.stringify(ids[`__${k}__`] ?? null));
      body = JSON.parse(raw);
      for (const [k, v] of Object.entries(body)) {
        if (v === null && cfg.body[k] && String(cfg.body[k]).startsWith("__")) delete body[k];
      }
    }
    let status = 0;
    let note = "";
    const started = Date.now();
    try {
      const r = await fetch(`${BASE}/api/ai/${name}`, {
        method,
        headers: { "Content-Type": "application/json", cookie: cookieHeader(), "Idempotency-Key": `verify-${name}-${started}` },
        ...(body && method === "POST" ? { body: JSON.stringify(body) } : {}),
      });
      status = r.status;
      const d = await r.json().catch(() => ({}));
      note = String(d.error ?? d.detail ?? d.message ?? "ok");
    } catch (e) {
      note = e.message;
    }
    rows.push({ name, status, ms: Date.now() - started, note: note.slice(0, 60) });
  }

  rows.sort((a, b) => a.status - b.status || a.name.localeCompare(b.name));
  console.log(`route`.padEnd(26) + "HTTP".padEnd(6) + "ms".padEnd(8) + "result");
  console.log("-".repeat(105));
  for (const r of rows) {
    const mark = r.status === 200 ? "OK  " : "FAIL";
    console.log(`${mark} ${r.name.padEnd(24)} ${String(r.status).padEnd(5)} ${String(r.ms).padEnd(7)} ${r.note}`);
  }
  const ok = rows.filter((r) => r.status === 200).length;
  console.log(`\n${ok}/${rows.length} returned 200`);
  const failed = rows.filter((r) => r.status !== 200);
  if (failed.length) {
    console.log("\nFAILURES:");
    for (const f of failed) console.log(`  ${f.name}: ${f.status} ${f.note}`);
  }
})();
