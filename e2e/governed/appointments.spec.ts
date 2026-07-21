import { expect, test, type APIRequestContext } from "@playwright/test";

const password = "E2E-Only-Passphrase-2026!";

async function accessToken(request: APIRequestContext, email: string) {
  const response = await request.post("/api/auth/login", { data: { email, password } });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.refreshToken).toMatch(/^[A-Za-z0-9_-]{50,100}$/);
  return body.token as string;
}

test("authorized booking is idempotent, tenant-scoped, audited, and completes its lifecycle", async ({ request }) => {
  expect((await request.get("/api/appointments")).status()).toBe(401);
  expect((await request.get("/api/audit/Appointment/not-visible")).status()).toBe(401);
  expect((await request.post("/api/cron/integration-deliveries")).status()).toBe(401);
  expect((await request.post("/api/marketplace/book", { data: {} })).status()).toBe(410);
  expect((await request.post("/api/auth/login", { data: { email: "owner@governed-e2e.test", password: "wrong" } })).status()).toBe(401);

  const token = await accessToken(request, "owner@governed-e2e.test");
  const authorization = { Authorization: `Bearer ${token}` };
  const appointment = {
    clientId: "e2e-client-primary",
    staffId: "e2e-staff-primary",
    locationId: "e2e-location-primary",
    scheduledStart: "2031-08-10T14:00:00.000Z",
    serviceIds: ["e2e-service-primary"],
    source: "PHONE",
  };
  const first = await request.post("/api/appointments", {
    headers: { ...authorization, "Idempotency-Key": "governed-e2e-booking-0001" },
    data: appointment,
  });
  expect(first.status()).toBe(201);
  const created = await first.json();
  expect(created).toMatchObject({ status: "BOOKED", businessId: "e2e-business-primary", version: 0 });

  const replay = await request.post("/api/appointments", {
    headers: { ...authorization, "Idempotency-Key": "governed-e2e-booking-0001" },
    data: appointment,
  });
  expect(replay.status()).toBe(200);
  expect(replay.headers()["idempotency-replayed"]).toBe("true");
  expect((await replay.json()).id).toBe(created.id);

  const otherToken = await accessToken(request, "owner@other-e2e.test");
  expect((await request.get(`/api/appointments/${created.id}`, { headers: { Authorization: `Bearer ${otherToken}` } })).status()).toBe(403);

  for (const [path, status, version] of [
    ["confirm", "CONFIRMED", 1],
    ["check-in", "CHECKED_IN", 2],
    ["start", "IN_SERVICE", 3],
    ["complete", "COMPLETED", 4],
  ] as const) {
    const response = await request.post(`/api/appointments/${created.id}/${path}`, { headers: authorization });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ status, version });
  }

  const audit = await request.get(`/api/audit?entityType=Appointment&entityId=${created.id}`, { headers: authorization });
  expect(audit.status()).toBe(200);
  const evidence = await audit.json();
  expect(evidence.logs).toHaveLength(5);
});
