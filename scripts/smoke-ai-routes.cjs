#!/usr/bin/env node
/**
 * Exercise every AI feature route with a valid payload and report the real
 * outcome. Uses the same field names the generated pages send.
 *
 * Usage: node scripts/smoke-ai-routes.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");

const project = path.resolve(__dirname, "..");
const env = parseEnv(fs.readFileSync(path.join(project, ".env"), "utf8"));
const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:30802";
const EMAIL = env.ADMIN_EMAIL;
const PASSWORD = env.ADMIN_PASSWORD;

/** name -> { method, path, body } — bodies mirror the generated pages. */
const CASES = [
  ["translate", "POST", "/api/ai/translate", { text: "Your appointment is confirmed for Tuesday at 10:00.", targetLanguage: "Spanish", context: "Salon SMS." }],
  ["message-generator", "POST", "/api/ai/message-generator", { type: "appointment_reminder", clientName: "Avery", businessName: "Luxe Beauty Studio", details: "Tuesday 10:00 with Jordan." }],
  ["review-response", "POST", "/api/ai/review-response", { rating: 3, reviewText: "Lovely stylist, but I waited twenty minutes." }],
  ["business-insights", "GET", "/api/ai/business-insights", null],
  ["appointment-optimizer", "POST", "/api/ai/appointment-optimizer", { date: "2026-10-06", optimize: "gaps" }],
  ["staff-matcher", "POST", "/api/ai/staff-matcher", { serviceId: "__service__", preferences: "Prefers curly-hair experience." }],
  ["therapist-match", "POST", "/api/ai/therapist-match", { clientId: "__client__" }],
  ["booking-assistant", "POST", "/api/ai/booking-assistant", { message: "I would like a colour appointment next Tuesday afternoon.", conversationHistory: [] }],
  ["checkin-recommend", "POST", "/api/ai/checkin-recommend", { clientId: "__client__" }],
  ["waitlist-intelligence", "POST", "/api/ai/waitlist-intelligence", { appointmentId: "__appointment__" }],
  ["inventory-autopilot", "POST", "/api/ai/inventory-autopilot", {}],
  ["before-after", "POST", "/api/ai/before-after", { clientId: "__client__", beforeId: "__photo__", afterId: "__photo__", serviceName: "Demo colour service" }],
  ["staff-shift-preferences", "POST", "/api/ai/staff-shift-preferences", { staffId: "__staff__", lookbackDays: 60 }],
  ["voice-receptionist", "POST", "/api/ai/voice-receptionist", { speechInput: "Hi, I would like to book a haircut Saturday morning.", language: "en" }],
  ["skin-kiosk", "POST", "/api/ai/skin-kiosk", { clientId: "__client__", concerns: "General cosmetic skincare routine.", imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" }],
];

(async () => {
  // Session
  const jar = [];
  const cookieHeader = () => jar.map((c) => `${c.name}=${c.value}`).join("; ");
  const remember = (res) => {
    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(";");
      const idx = pair.indexOf("=");
      jar.push({ name: pair.slice(0, idx), value: pair.slice(idx + 1) });
    }
  };

  let res = await fetch(`${BASE}/api/auth/csrf`);
  remember(res);
  const { csrfToken } = await res.json();

  res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieHeader() },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, json: "true" }),
    redirect: "manual",
  });
  remember(res);

  const session = await (await fetch(`${BASE}/api/auth/session`, { headers: { cookie: cookieHeader() } })).json();
  if (!session?.user) {
    console.error("Could not authenticate:", JSON.stringify(session));
    process.exit(1);
  }
  console.log(`Authenticated as ${session.user.email} (${session.user.businessId})\n`);

  // Resolve real ids referenced by __placeholders__.
  const api = async (p) => {
    const r = await fetch(`${BASE}${p}`, { headers: { cookie: cookieHeader() } });
    return r.ok ? r.json() : [];
  };
  const unwrap = (v) => (Array.isArray(v) ? v : v?.clients ?? v?.services ?? v?.staff ?? v?.appointments ?? v?.data ?? []);
  const clients = unwrap(await api("/api/clients"));
  const services = unwrap(await api("/api/services"));
  const staff = unwrap(await api("/api/staff"));
  const appointments = unwrap(await api("/api/appointments"));
  const photos = clients[0] ? unwrap(await api(`/api/clients/${clients[0].id}/photos`)) : [];

  const ids = {
    __client__: (Array.isArray(clients) ? clients[0]?.id : null) ?? null,
    __service__: (Array.isArray(services) ? services[0]?.id : null) ?? null,
    __staff__: (Array.isArray(staff) ? staff[0]?.id : null) ?? null,
    __photo__: (Array.isArray(photos) ? photos[0]?.id : null) ?? null,
    __appointment__: (Array.isArray(appointments) ? appointments[0]?.id : null) ?? null,
  };
  console.log("Resolved ids:", JSON.stringify(ids, null, 1), "\n");

  const rows = [];
  for (const [name, method, p, template] of CASES) {
    let body = template;
    if (body) {
      body = JSON.parse(JSON.stringify(body).replace(/"__(\w+)__"/g, (m, k) => JSON.stringify(ids[`__${k}__`] ?? null)));
      // drop placeholders we could not resolve
      for (const [k, v] of Object.entries(body)) if (v === null && String(template[k]).startsWith("__")) delete body[k];
    }

    let status = 0;
    let note = "";
    try {
      const r = await fetch(`${BASE}${p}`, {
        method,
        headers: { "Content-Type": "application/json", cookie: cookieHeader(), "Idempotency-Key": `smoke-${name}-${Date.now()}` },
        ...(body && method === "POST" ? { body: JSON.stringify(body) } : {}),
      });
      status = r.status;
      const data = await r.json().catch(() => ({}));
      note = String(data.error ?? data.message ?? (data.success ? "ok" : Object.keys(data).slice(0, 4).join(",")));
    } catch (e) {
      note = e.message;
    }
    rows.push([name, status, note.slice(0, 70)]);
  }

  console.log("route".padEnd(26), "HTTP", " result");
  console.log("-".repeat(110));
  for (const [n, s, note] of rows) {
    const mark = s === 200 ? "OK  " : "FAIL";
    console.log(`${mark} ${n.padEnd(24)} ${String(s).padEnd(5)} ${note}`);
  }
  const ok = rows.filter(([, s]) => s === 200).length;
  console.log(`\n${ok}/${rows.length} returned 200`);
})();
