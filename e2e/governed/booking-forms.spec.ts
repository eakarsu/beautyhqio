import { expect, test } from "@playwright/test";

const password = "E2E-Only-Passphrase-2026!";
for (const [path, date] of [["/appointments/new", "2031-08-20"], ["/calendar/new", "2031-08-21"]]) {
  test(`${path} creates a persisted appointment through the UI`, async ({ page }) => {
    const csrf = await page.request.get("/api/auth/csrf");
    const { csrfToken } = await csrf.json();
    const login = await page.request.post("/api/auth/callback/credentials", {
      form: { csrfToken, email: "owner@governed-e2e.test", password, json: "true" },
    });
    expect(login.ok()).toBe(true);
    await page.goto(path);
    await page.getByRole("combobox").filter({ hasText: /Select a client/ }).click();
    await page.getByRole("option", { name: /E2E Client/ }).click();
    await page.getByRole("combobox").filter({ hasText: /Select staff/ }).click();
    await page.getByRole("option", { name: "E2E Owner", exact: true }).click();
    await page.getByRole("combobox").filter({ hasText: /Select a service/ }).click();
    await page.getByRole("option", { name: /Governed Cut/ }).click();
    await page.locator('input[type="date"]').fill(date);
    await page.locator('input[type="time"]').fill("10:00");
    const created = page.waitForResponse(response => response.url().endsWith("/api/appointments") && response.request().method() === "POST");
    await page.getByRole("button", { name: /Create Appointment|Schedule Appointment/ }).click();
    const response = await created;
    expect(response.status(), await response.text()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ locationId: "e2e-location-primary", status: "BOOKED" });
    expect(body.staff.user).not.toHaveProperty("password");
    expect(body.services[0].serviceId).toBe("e2e-service-primary");
    expect(response.request().headers()["idempotency-key"]).toBeTruthy();
    const persisted = await page.request.get(`/api/appointments/${body.id}`);
    expect(persisted.status()).toBe(200);
    expect((await persisted.json()).id).toBe(body.id);
  });
}

test("account and money endpoints enforce authentication over HTTP", async ({ request }) => {
  for (const path of ["/api/users", "/api/checkout"]) expect((await request.get(path)).status()).toBe(401);
  expect((await request.put("/api/users/e2e-owner-primary", { data: { role: "PLATFORM_ADMIN" } })).status()).toBe(401);
  for (const path of ["/api/checkout", "/api/payments/refund", "/api/payments/charge", "/api/payments/confirm"]) expect((await request.post(path, { data: {} })).status()).toBe(401);
});

test("web sessions lose revoked permissions and newly created accounts can log in", async ({ request, playwright }) => {
  const login = await request.post("/api/auth/login", { data: { email: "owner@governed-e2e.test", password } });
  const headers = { Authorization: `Bearer ${(await login.json()).token}` };
  const email = `session-regression-${Date.now()}@governed-e2e.test`;
  const created = await request.post("/api/users", { headers, data: { email, password, firstName: "Session", lastName: "Test", role: "MANAGER" } });
  expect(created.status()).toBe(201);
  const user = await created.json();
  const client = await playwright.request.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000" });
  try {
    const { csrfToken } = await (await client.get("/api/auth/csrf")).json();
    await client.post("/api/auth/callback/credentials", { form: { email, password, csrfToken, json: "true" } });
    expect((await client.get("/api/appointments")).status()).toBe(200);
    expect((await request.put(`/api/users/${user.id}`, { headers, data: { role: "CLIENT" } })).status()).toBe(200);
    const session = await (await client.get("/api/auth/session")).json();
    expect(session.user.role).toBe("CLIENT");
    expect((await request.put(`/api/users/${user.id}`, { headers, data: { isActive: false } })).status()).toBe(200);
    expect((await client.get("/api/appointments")).status()).toBe(401);
  } finally { await client.dispose(); }
});
