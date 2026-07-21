import { PrismaClient } from "@prisma/client";
import { createAppointment, transitionAppointment } from "../service";
import type { AuthenticatedUser } from "@/lib/api-auth";
import { processIntegrationDeliveries } from "@/lib/integration-deliveries";
import { issueMobileSession, rotateMobileSession } from "@/lib/mobile-session";

const enabled = process.env.RUN_DATABASE_INTEGRATION === "true";
const describeDb = enabled ? describe : describe.skip;

describeDb("appointment persistence journey", () => {
  const db = new PrismaClient();
  let owner: AuthenticatedUser;
  let otherOwner: AuthenticatedUser;
  let clientId: string;
  let staffId: string;
  let locationId: string;
  let serviceId: string;

  beforeAll(async () => {
    const business = await db.business.create({ data: { name: "Persistence Salon", type: "HAIR_SALON" } });
    const other = await db.business.create({ data: { name: "Other Salon", type: "SPA" } });
    const user = await db.user.create({ data: { email: "owner@persistence.test", firstName: "Owner", lastName: "One", role: "OWNER", businessId: business.id } });
    const otherUser = await db.user.create({ data: { email: "owner@other.test", firstName: "Owner", lastName: "Two", role: "OWNER", businessId: other.id } });
    const location = await db.location.create({ data: { businessId: business.id, name: "Main", address: "1 Test Way", city: "Test", state: "NY", zip: "10001" } });
    const staffUser = await db.user.create({ data: { email: "staff@persistence.test", firstName: "Staff", lastName: "One", role: "STAFF", businessId: business.id } });
    const staff = await db.staff.create({ data: { userId: staffUser.id, locationId: location.id, specialties: [], serviceIds: [] } });
    const client = await db.client.create({ data: { businessId: business.id, firstName: "Client", lastName: "One", phone: "+12125550100", email: "client@persistence.test", tags: [] } });
    const service = await db.service.create({ data: { businessId: business.id, name: "Cut", duration: 45, price: 75 } });
    owner = { id: user.id, email: user.email, role: "OWNER", businessId: business.id, businessName: business.name, staffId: null, clientId: null, firstName: user.firstName, lastName: user.lastName, isPlatformAdmin: false };
    otherOwner = { ...owner, id: otherUser.id, email: otherUser.email, businessId: other.id, businessName: other.name };
    clientId = client.id; staffId = staff.id; locationId = location.id; serviceId = service.id;
  });

  afterAll(async () => db.$disconnect());

  test("persists one idempotent booking, audit, activity and provider outbox", async () => {
    const input = { clientId, staffId, locationId, scheduledStart: "2026-08-10T14:00:00.000Z", serviceIds: [serviceId], source: "PHONE" };
    const first = await createAppointment(db, owner, input, "persist-booking-0001");
    const replay = await createAppointment(db, owner, input, "persist-booking-0001");
    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.appointment.id).toBe(first.appointment.id);
    expect(await db.auditLog.count({ where: { entityId: first.appointment.id, action: "APPOINTMENT_CREATED" } })).toBe(1);
    expect(await db.integrationDelivery.count({ where: { appointmentId: first.appointment.id } })).toBe(3);
  });

  test("enforces tenant and overlap boundaries", async () => {
    const input = { clientId, staffId, locationId, scheduledStart: "2026-08-10T14:15:00.000Z", serviceIds: [serviceId], source: "PHONE" };
    await expect(createAppointment(db, otherOwner, input, "persist-booking-0002")).rejects.toMatchObject({ code: "TENANT_MISMATCH" });
    await expect(createAppointment(db, owner, input, "persist-booking-0003")).rejects.toMatchObject({ code: "STAFF_CONFLICT" });
  });

  test("runs the persisted lifecycle with versioned audit evidence", async () => {
    const created = await db.appointment.findFirstOrThrow({ where: { idempotencyKey: "persist-booking-0001" } });
    await transitionAppointment(db, owner, created.id, "CONFIRMED");
    await transitionAppointment(db, owner, created.id, "CHECKED_IN");
    await transitionAppointment(db, owner, created.id, "IN_SERVICE");
    const completed = await transitionAppointment(db, owner, created.id, "COMPLETED");
    expect(completed.status).toBe("COMPLETED");
    expect(completed.version).toBe(4);
    expect(await db.auditLog.count({ where: { entityId: created.id } })).toBe(5);
    expect(await db.integrationDelivery.count({ where: { appointmentId: created.id } })).toBe(7);
  });

  test("persists a bounded provider failure for retry instead of losing it", async () => {
    const created = await db.appointment.findFirstOrThrow({ where: { idempotencyKey: "persist-booking-0001" } });
    const email = await db.integrationDelivery.findFirstOrThrow({
      where: { appointmentId: created.id, kind: "CONFIRMATION_EMAIL" },
    });
    await db.integrationDelivery.updateMany({
      where: { appointmentId: created.id, id: { not: email.id } },
      data: { nextAttemptAt: new Date("2099-01-01T00:00:00.000Z") },
    });
    await db.integrationDelivery.update({
      where: { id: email.id },
      data: { status: "PENDING", attempts: 0, nextAttemptAt: new Date(0) },
    });

    await expect(processIntegrationDeliveries(1)).resolves.toEqual([{ id: email.id, status: "RETRY" }]);
    await expect(db.integrationDelivery.findUniqueOrThrow({ where: { id: email.id } })).resolves.toMatchObject({
      status: "RETRY",
      attempts: 1,
      lastErrorCode: "EMAIL_PROVIDER_REJECTED",
    });
  });

  test("rotates refresh credentials once and rejects replay", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { id: owner.id } });
    const issued = await issueMobileSession(db, user);
    const rotated = await rotateMobileSession(db, issued.refreshToken);
    expect(rotated?.refreshToken).toBeTruthy();
    expect(rotated?.refreshToken).not.toBe(issued.refreshToken);
    await expect(rotateMobileSession(db, issued.refreshToken)).resolves.toBeNull();
    expect(await db.mobileSession.count({ where: { userId: user.id } })).toBe(2);
    expect(await db.mobileSession.count({ where: { userId: user.id, revokedAt: { not: null } } })).toBe(1);
  });
});
