import { webcrypto } from "node:crypto";
import { bookingBody, bookingRequest } from "../booking-request";
import { createAppointmentSchema, parseIdempotencyKey } from "../domain";

const form = { clientId: "client", staffId: "staff", serviceId: "service", date: "2031-08-10", time: "14:00", notes: "" };
beforeAll(() => { if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto }); });
test("both booking forms produce the governed API contract", () => {
  const body = bookingBody(form, "location");
  expect(createAppointmentSchema.safeParse(body).success).toBe(true);
  const request = bookingRequest(body, null);
  expect(parseIdempotencyKey(request.init.headers["Idempotency-Key"])).toBeTruthy();
  expect(JSON.parse(request.init.body)).toMatchObject({ locationId: "location", serviceIds: ["service"] });
});
test("retries retain the key while edited bookings get a new key", () => {
  const body = bookingBody(form, "location");
  const first = bookingRequest(body, null);
  expect(bookingRequest(body, first.attempt).attempt.key).toBe(first.attempt.key);
  expect(bookingRequest({ ...body, notes: "changed" }, first.attempt).attempt.key).not.toBe(first.attempt.key);
});
