import { PrismaClient } from "@prisma/client";
import { mutation, type Context } from "../core";
import { redeemGift, redeemLoyalty, receiveOrder } from "../balances";
import { timeAction } from "../time";
import { roomAction } from "../rooms";
import { createAppointment } from "@/lib/appointments/service";
import { rescheduleAppointment } from "@/lib/appointments/reschedule";
import { prisma } from "@/lib/prisma";
const suite =
  process.env.RUN_OPERATIONS_INTEGRATION === "true" ? describe : describe.skip;
suite("durable operations", () => {
  const db = new PrismaClient();
  let ctx: Context;
  let other: Context;
  let staffId: string;
  let clientId: string;
  let locationId: string;
  let serviceId: string;
  let cardCode: string;
  const request = (key: string) =>
    new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });
  beforeAll(async () => {
    const b = await db.business.create({
      data: { name: "Operations test", type: "SPA" },
    });
    const b2 = await db.business.create({
      data: { name: "Other tenant test", type: "SPA" },
    });
    const user = await db.user.create({
      data: {
        email: `operations-${b.id}@test.invalid`,
        firstName: "Test",
        lastName: "Owner",
        role: "OWNER",
        businessId: b.id,
      },
    });
    ctx = {
      businessId: b.id,
      user: {
        ...user,
        businessName: b.name,
        staffId: null,
        clientId: null,
        isPlatformAdmin: false,
      },
    };
    other = {
      ...ctx,
      businessId: b2.id,
      user: { ...ctx.user, businessId: b2.id },
    };
    const loc = await db.location.create({
      data: {
        name: "Main",
        businessId: b.id,
        address: "Test",
        city: "Test",
        state: "NY",
        zip: "10000",
        advanceBookingDays: 3650,
      },
    });
    locationId = loc.id;
    const staff = await db.staff.create({
      data: {
        userId: user.id,
        locationId,
        specialties: [],
        serviceIds: [],
        hourlyRate: 20,
      },
    });
    staffId = staff.id;
    const client = await db.client.create({
      data: {
        businessId: b.id,
        firstName: "Test",
        lastName: "Client",
        phone: "+12125550111",
        tags: [],
        allowEmail: false,
        allowSms: false,
      },
    });
    clientId = client.id;
    const service = await db.service.create({
      data: {
        businessId: b.id,
        name: "Test service",
        duration: 60,
        price: 100,
        bufferTime: 15,
      },
    });
    serviceId = service.id;
    cardCode = `test-${b.id}`;
    await db.giftCard.create({
      data: {
        businessId: b.id,
        code: cardCode,
        initialBalance: 100,
        currentBalance: 100,
      },
    });
  });
  afterAll(async () => {
    await db.$disconnect();
    await prisma.$disconnect();
  });
  test("concurrent gift redemption cannot overdraw; retries replay once", async () => {
    const input = { code: cardCode, amount: 70 };
    const results = await Promise.allSettled(
      ["gift-operation-1", "gift-operation-2"].map((k) =>
        mutation(ctx, request(k), "gift", input, (tx) =>
          redeemGift(tx, ctx, input),
        ),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const key =
      results[0].status === "fulfilled"
        ? "gift-operation-1"
        : "gift-operation-2";
    const replay = await mutation(ctx, request(key), "gift", input, (tx) =>
      redeemGift(tx, ctx, input),
    );
    expect(replay.remainingBalance).toBe(30);
    expect(
      await db.giftCardUsage.count({ where: { giftCard: { code: cardCode } } }),
    ).toBe(1);
    await expect(
      mutation(ctx, request(key), "gift", { ...input, amount: 1 }, (tx) =>
        redeemGift(tx, ctx, { ...input, amount: 1 }),
      ),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      mutation(other, request("cross-tenant-gift"), "gift", input, (tx) =>
        redeemGift(tx, other, input),
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
  test("loyalty points cannot be redeemed twice concurrently", async () => {
    const program = await db.loyaltyProgram.create({
      data: { businessId: ctx.businessId, name: "Test" },
    });
    await db.loyaltyAccount.create({
      data: { clientId, programId: program.id, pointsBalance: 100 },
    });
    const reward = await db.loyaltyReward.create({
      data: {
        programId: program.id,
        name: "Reward",
        pointsCost: 80,
        type: "discount",
        value: 10,
      },
    });
    const input = { clientId, rewardId: reward.id };
    const rs = await Promise.allSettled(
      ["loyalty-test-1", "loyalty-test-2"].map((k) =>
        mutation(ctx, request(k), "loyalty", input, (tx) =>
          redeemLoyalty(tx, ctx, input),
        ),
      ),
    );
    expect(rs.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (await db.loyaltyAccount.findUniqueOrThrow({ where: { clientId } }))
        .pointsBalance,
    ).toBe(20);
  });
  test("receiving rolls back all lines if an item is invalid", async () => {
    const vendor = await db.vendor.create({
      data: { name: "Test vendor", businessId: ctx.businessId },
    });
    const product = await db.product.create({
      data: { name: "Test stock", businessId: ctx.businessId, price: 10 },
    });
    const order = await db.purchaseOrder.create({
      data: {
        vendorId: vendor.id,
        createdById: ctx.user.id,
        poNumber: `PO-${vendor.id}`,
        status: "submitted",
        subtotal: 30,
        totalAmount: 30,
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              quantityOrdered: 3,
              unitCost: 10,
              totalCost: 30,
            },
          ],
        },
      },
      include: { items: true },
    });
    const bad = {
      items: [
        { itemId: order.items[0].id, quantityReceived: 2 },
        { itemId: "not-in-order", quantityReceived: 1 },
      ],
    };
    await expect(
      mutation(ctx, request("receive-rollback-1"), "receive", bad, (tx) =>
        receiveOrder(tx, ctx, order.id, bad),
      ),
    ).rejects.toMatchObject({ status: 422 });
    expect(
      (await db.product.findUniqueOrThrow({ where: { id: product.id } }))
        .quantityOnHand,
    ).toBe(0);
    const good = {
      items: [{ itemId: order.items[0].id, quantityReceived: 3 }],
    };
    expect(
      await mutation(ctx, request("receive-success-1"), "receive", good, (tx) =>
        receiveOrder(tx, ctx, order.id, good),
      ),
    ).toMatchObject({ newStatus: "received" });
    expect(
      (await db.product.findUniqueOrThrow({ where: { id: product.id } }))
        .quantityOnHand,
    ).toBe(3);
  });
  test("clock-in is unique and timesheets require manager approval", async () => {
    const entry = await mutation(
      ctx,
      request("clock-in-test-01"),
      "clock",
      { staffId },
      (tx) => timeAction(tx, ctx, { action: "clock-in", staffId }),
    );
    await expect(
      mutation(ctx, request("clock-in-test-02"), "clock", { staffId }, (tx) =>
        timeAction(tx, ctx, { action: "clock-in", staffId }),
      ),
    ).rejects.toMatchObject({ status: 409 });
    const closed = await mutation(
      ctx,
      request("clock-out-test-1"),
      "clockout",
      { id: entry.id },
      (tx) =>
        timeAction(tx, ctx, {
          action: "clock-out",
          id: entry.id,
          breakMinutes: 0,
        }),
    );
    expect(closed.status).toBe("SUBMITTED");
    const approved = await mutation(
      ctx,
      request("clock-approve-1"),
      "approve",
      { id: entry.id },
      (tx) =>
        timeAction(tx, ctx, {
          action: "approve",
          id: entry.id,
          version: closed.version,
        }),
    );
    expect(approved.status).toBe("APPROVED");
  });
  test("room reservations prevent cross-staff resource conflicts and cleaning requires checklist", async () => {
    const room = await mutation(
      ctx,
      request("room-create-01"),
      "roomcreate",
      {},
      (tx) =>
        roomAction(tx, ctx, {
          action: "create",
          locationId,
          name: "Treatment one",
          checklist: ["Clean surfaces"],
        }),
    );
    await expect(
      mutation(ctx, request("room-ready-test"), "roomready", {}, (tx) =>
        roomAction(tx, ctx, {
          action: "status",
          id: room.id,
          version: room.version,
          status: "READY",
          completedChecklist: [],
        }),
      ),
    ).rejects.toMatchObject({ status: 422 });
    const a = await createAppointment(
      db,
      ctx.user,
      {
        locationId,
        staffId,
        clientId,
        serviceIds: [serviceId],
        scheduledStart: "2027-03-01T14:00:00Z",
      },
      "room-booking-001",
    );
    await mutation(ctx, request("room-reserve-01"), "roomreserve", {}, (tx) =>
      roomAction(tx, ctx, {
        action: "reserve",
        id: room.id,
        appointmentId: a.appointment.id,
      }),
    );
    await expect(
      mutation(ctx, request("room-reserve-02"), "roomreserve", {}, (tx) =>
        roomAction(tx, ctx, {
          action: "reserve",
          id: room.id,
          appointmentId: a.appointment.id,
        }),
      ),
    ).rejects.toMatchObject({ status: 409 });
    const updated = await mutation(
      ctx,
      request("reschedule-test1"),
      "reschedule",
      {},
      (tx) =>
        rescheduleAppointment(tx, ctx, a.appointment.id, {
          scheduledStart: new Date("2027-03-02T14:00Z"),
          version: 0,
          reason: "Client requested",
        }),
    );
    expect(updated.version).toBe(1);
    expect(
      (
        await db.roomReservation.findUniqueOrThrow({
          where: { appointmentId: updated.id },
        })
      ).start,
    ).toEqual(updated.scheduledStart);
  });
});

suite("subscription checkout retry and reconciliation", () => {
  afterAll(() => prisma.$disconnect());
  test("unknown checkout is recovered without a second create, paid plan needs current matching provider receipts", async () => {
    const { beginBusinessBilling, reconcileBusinessCheckout } =
      await import("@/lib/business-billing");
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    const business = await prisma.business.create({
        data: { name: "Billing fixture", type: "HAIR_SALON" },
      }),
      owner = await prisma.user.create({
        data: {
          email: `billing-${business.id}@example.test`,
          firstName: "Billing",
          lastName: "Fixture",
          role: "OWNER",
          businessId: business.id,
        },
      });
    await prisma.businessSubscription.create({
      data: { businessId: business.id, stripeCustomerId: "cus_" + business.id },
    });
    let session: any = null,
      subscription: any = null,
      createCount = 0;
    const provider: any = {
      subscriptions: {
        list: async () => ({ data: [] }),
        retrieve: async () => subscription,
      },
      checkout: {
        sessions: {
          list: async () => ({
            data: session?.status === "open" ? [session] : [],
          }),
          retrieve: async () => session,
          expire: async () => (session = { ...session, status: "expired" }),
          create: async (input: any, options: any) => {
            createCount++;
            expect(options.idempotencyKey).toMatch(/^business-checkout:/);
            session = {
              id: "cs_" + business.id,
              mode: "subscription",
              customer: "cus_" + business.id,
              url: "https://checkout.stripe.com/c/pay/fixture",
              status: "open",
              metadata: input.metadata,
            };
            throw Error("Fixture network timeout after provider creation");
          },
        },
      },
    };
    await expect(
      beginBusinessBilling(
        business.id,
        owner.email,
        "GROWTH",
        "billing-fixture-request",
        owner.id,
        provider,
      ),
    ).rejects.toThrow("timeout");
    let attempt = await prisma.businessBillingAttempt.findFirstOrThrow({
      where: { businessId: business.id },
    });
    expect(attempt.status).toBe("UNKNOWN");
    expect(
      (
        await prisma.businessSubscription.findUniqueOrThrow({
          where: { businessId: business.id },
        })
      ).plan,
    ).toBe("STARTER");
    await expect(
      beginBusinessBilling(
        business.id,
        owner.email,
        "PRO",
        "different-billing-key",
        owner.id,
        provider,
      ),
    ).rejects.toThrow("current checkout");
    expect(
      await beginBusinessBilling(
        business.id,
        owner.email,
        "GROWTH",
        "billing-fixture-request",
        owner.id,
        provider,
      ),
    ).toMatchObject({ mode: "checkout" });
    expect(createCount).toBe(1);
    attempt = await prisma.businessBillingAttempt.findUniqueOrThrow({
      where: { id: attempt.id },
    });
    expect(attempt.status).toBe("OPEN");
    const now = Math.floor(Date.now() / 1000);
    subscription = {
      id: "sub_" + business.id,
      customer: "cus_" + business.id,
      metadata: { type: "business_subscription", businessId: business.id },
      status: "active",
      items: {
        data: [
          {
            quantity: 1,
            current_period_start: now - 100,
            current_period_end: now + 86400,
            price: {
              id: "price_fixture",
              unit_amount: 4900,
              currency: "usd",
              recurring: { interval: "month", interval_count: 1 },
            },
          },
        ],
      },
      latest_invoice: {
        status: "open",
        lines: {
          data: [
            {
              quantity: 1,
              amount: 4900,
              currency: "usd",
              period: { start: now - 100, end: now + 86400 },
              pricing: { price_details: { price: "price_fixture" } },
            },
          ],
        },
      },
    };
    session = { ...session, status: "complete", subscription: subscription.id };
    await reconcileBusinessCheckout(
      business.id,
      attempt.id,
      session.id,
      false,
      provider,
    );
    expect(
      (
        await prisma.businessSubscription.findUniqueOrThrow({
          where: { businessId: business.id },
        })
      ).plan,
    ).toBe("STARTER");
    subscription.latest_invoice.status = "paid";
    await Promise.all([
      reconcileBusinessCheckout(
        business.id,
        attempt.id,
        session.id,
        false,
        provider,
      ),
      reconcileBusinessCheckout(
        business.id,
        attempt.id,
        session.id,
        false,
        provider,
      ),
    ]);
    expect(
      (
        await prisma.businessSubscription.findUniqueOrThrow({
          where: { businessId: business.id },
        })
      ).plan,
    ).toBe("GROWTH");
    expect(createCount).toBe(1);
    session = { ...session, customer: "cus_wrong" };
    await expect(
      reconcileBusinessCheckout(
        business.id,
        attempt.id,
        session.id,
        false,
        provider,
      ),
    ).rejects.toThrow("does not match");
    await prisma.user.update({
      where: { id: owner.id },
      data: { isActive: false },
    });
    await expect(
      beginBusinessBilling(
        business.id,
        owner.email,
        "GROWTH",
        "another-billing-key",
        owner.id,
        provider,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});
