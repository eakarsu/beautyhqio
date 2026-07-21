import { AppointmentDomainError, assertTransition, createAppointmentSchema, parseIdempotencyKey, retryDelayMs } from "../domain";

describe("governed appointment domain", () => {
  const valid = {
    clientId: "client-1", staffId: "staff-1", locationId: "location-1",
    scheduledStart: "2026-08-01T14:00:00.000Z", scheduledEnd: "2026-08-01T15:00:00.000Z",
    serviceIds: ["service-1"], source: "ONLINE",
  };

  test("accepts a bounded appointment request", () => {
    const result = createAppointmentSchema.parse(valid);
    expect(result.scheduledStart).toEqual(new Date(valid.scheduledStart));
  });

  test("requires at least one service", () => {
    expect(() => createAppointmentSchema.parse({ ...valid, serviceIds: undefined })).toThrow();
  });

  test("rejects inverted time ranges", () => {
    expect(() => createAppointmentSchema.parse({ ...valid, scheduledEnd: "2026-08-01T13:00:00.000Z" })).toThrow();
  });

  test("rejects excessive free text", () => {
    expect(() => createAppointmentSchema.parse({ ...valid, notes: "x".repeat(1001) })).toThrow();
  });

  test.each([
    ["BOOKED", "CONFIRMED"], ["CONFIRMED", "CHECKED_IN"], ["CHECKED_IN", "IN_SERVICE"], ["IN_SERVICE", "COMPLETED"],
  ] as const)("allows %s to %s", (from, to) => expect(() => assertTransition(from, to)).not.toThrow());

  test.each([
    ["BOOKED", "COMPLETED"], ["COMPLETED", "BOOKED"], ["CANCELLED", "CONFIRMED"], ["NO_SHOW", "CHECKED_IN"],
  ] as const)("rejects %s to %s", (from, to) => expect(() => assertTransition(from, to)).toThrow(AppointmentDomainError));

  test("requires a replay-safe idempotency key", () => {
    expect(parseIdempotencyKey("booking:tenant:123456")).toBe("booking:tenant:123456");
    expect(() => parseIdempotencyKey("short")).toThrow(AppointmentDomainError);
    expect(() => parseIdempotencyKey("bad key with spaces")).toThrow(AppointmentDomainError);
  });

  test("retry schedule is bounded and monotonic", () => {
    const delays = [1, 2, 3, 4, 5, 99].map(retryDelayMs);
    expect(delays).toEqual([60_000, 300_000, 1_800_000, 7_200_000, 28_800_000, 28_800_000]);
  });
});
